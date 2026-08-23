/**
 * Conversation entrance-motion engine (feature: motion).
 *
 * Watches two host surfaces:
 * - The transcript chat rows — the host renders one `[data-chat-anchor-key]`
 *   wrapper per message (user / assistant / tool, all kinds) inside a
 *   `[data-chat-flow]` column that stays mounted across conversation
 *   switches.
 * - The sidebar session tree — `[role="treeitem"]` rows (workspace groups and
 *   sessions) inside `[role="tree"]` containers.
 *
 * Both get the entrance animation class (see motion.module.css):
 * - Batch classification: a "load" batch (the container was empty before, or
 *   rows were removed in the same batch = first render / conversation
 *   switch) gets a per-row stagger so the surface cascades in instead of
 *   popping; an "incremental" batch (streaming turns, older-history paging,
 *   search results, group expand) gets no delay and, for the tree, no
 *   entrance at all — only wholesale loads animate the sidebar.
 * - The session-switch signal (notifySessionSwitch) force-replays the
 *   transcript rows AND the currently selected tree item, so every
 *   open/switch animates — not just the first.
 *
 * The observer starts before the settings scope resolves, buffering batches
 * until the feature state lands, so even a slow settings load still captures
 * the very first conversation render.
 */
import { MOTION_STYLES, NEW_CHAT_MOTION_STYLES, SIDEBAR_MOTION_STYLES, } from "../../shared.js";
import './motion.module.css';
/** Chat-row selector: the host renders one anchored row per message. */
const ANCHOR = '[data-chat-anchor-key]';
/** Sidebar tree items: session/workspace rows inside a `role="tree"`. */
const TREE_ITEM = '[role="tree"] [role="treeitem"]';
/** Every tracked item on a container (rows + tree items, one kind per container). */
const ITEM_SELECTOR = `${ANCHOR}, ${TREE_ITEM}`;
/**
 * Selection-box animation class: applied to a sidebar tree item the moment it
 * becomes the active conversation, briefly tracing the selection box around
 * it (see motion.module.css) before the host's static highlight takes over.
 */
export const SELECT_ANIMATION_CLASS = 'dsu-motion-select';
/**
 * Panel-loading class: applied to the transcript column when a conversation
 * loads or switches — the whole column fades in with a gentle drop while its
 * rows stagger in (see motion.module.css).
 */
export const PANEL_ANIMATION_CLASS = 'dsu-motion-panel';
/**
 * Entrance classes applied to marked rows. Literal (global) classes on
 * purpose: the engine runs identically in the browser and in jsdom tests,
 * independent of CSS-module processing (the keyframes live in
 * motion.module.css). ROW_IN_CLASS is the "already animated" marker used for
 * reuse detection and cleanup; the style class drives the animation.
 */
export const ROW_IN_CLASS = 'dsu-motion-row-in';
/**
 * Every style class the engine may apply (for reuse reset + cleanup). The
 * style sets share the `fade` id, so the union is deduplicated.
 */
export const STYLE_CLASSES = [...new Set([...MOTION_STYLES, ...SIDEBAR_MOTION_STYLES, ...NEW_CHAT_MOTION_STYLES])]
    .map((style) => styleClass(style));
/** Pure: the CSS class that carries one style's entrance animation. */
export function styleClass(style) {
    return `dsu-motion-${style}`;
}
/** Per-row stagger step on load batches (ms). */
export const STAGGER_STEP_MS = 40;
/** Stagger cap: rows beyond this wait no longer (the tail joins together). */
export const STAGGER_CAP_MS = 320;
/** Longest buffered batch queue while the feature is disabled. */
const MAX_PENDING_BATCHES = 8;
/**
 * Buffered batches older than this (ms) are dropped at flush: their rows have
 * been on screen long enough that replaying the entrance would read as a
 * pop-in, not an arrival. Covers slow settings resolution and re-enables.
 */
const FRESHNESS_WINDOW_MS = 400;
/** Delay before the session-switch replay scans the transcript (host commit). */
const SWITCH_REPLAY_MS = 60;
/** Retry interval while the transcript rows have not mounted yet. */
const SWITCH_RETRY_MS = 80;
/** Max replay retries before giving up on an empty transcript. */
const MAX_SWITCH_RETRIES = 12;
/** Pure: the entrance delay for the i-th row of a load batch (0-based). */
export function staggerDelay(index) {
    const i = Number.isFinite(index) && index > 0 ? Math.floor(index) : 0;
    return Math.min(i * STAGGER_STEP_MS, STAGGER_CAP_MS);
}
/** Pure: whether an added node is a top-level chat row (not nested in one). */
export function isChatRow(node) {
    return node instanceof HTMLElement
        && node.matches(ANCHOR)
        && node.parentElement?.closest(ANCHOR) === null;
}
/**
 * Pure: whether an added node is a sidebar tree item. Nested items are
 * allowed: session rows live INSIDE their workspace group row (the host
 * nests them), so a top-level-only check would silently drop them.
 */
export function isTreeItem(node) {
    return node instanceof HTMLElement && node.matches(TREE_ITEM);
}
/** Whether any motion toggle is on (the engine stays inert only when all are off). */
export function anyMotionEnabled(state) {
    return state.transcript || state.sidebar || state.selection || state.newChat;
}
/**
 * Install the entrance-motion engine. Starts observing immediately (batches
 * buffer while disabled) and returns the engine handle: teardown plus the
 * session-switch replay signal (see {@link MotionEngine}).
 * @param options - feature-state access (scope-driven).
 */
export function installConversationEntrance(options) {
    let state = options.getState();
    let pending = [];
    const marked = new Set();
    // Per-container anchor-row count from the last observed batch, used to tell
    // a first render (empty before) from an incremental append.
    const lastCount = new Map();
    // Session-switch replay bookkeeping.
    let notifyCount = 0;
    let switchTimer = 0;
    let switchAttempts = 0;
    let bootTimer = 0;
    let bootAttempts = 0;
    let disposed = false;
    // One-shot boot scan: marks tree items the observer missed (the sidebar
    // tree can mount before the engine installs); never re-runs on switches.
    let bootScanned = false;
    const clearMarked = () => {
        for (const row of marked) {
            row.classList.remove(ROW_IN_CLASS, SELECT_ANIMATION_CLASS, ...STYLE_CLASSES);
            row.style.removeProperty('--dsu-motion-delay');
        }
        marked.clear();
        // Persistent selection boxes may sit on rows the engine never tracked
        // (boot-scanned or host-re-rendered); sweep them all on disable/teardown.
        for (const row of document.querySelectorAll(`.${SELECT_ANIMATION_CLASS}`)) {
            row.classList.remove(SELECT_ANIMATION_CLASS);
        }
    };
    function applyBatch(rows, load) {
        // Document-order the batch so the stagger cascades top-down.
        const ordered = [...rows].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
        // Batches are homogeneous (transcript rows or sidebar tree items); each
        // surface carries its own style selection.
        const isTree = ordered[0] !== undefined && isTreeItem(ordered[0]);
        const styleCls = styleClass(isTree ? state.sidebarStyle : state.style);
        for (let i = 0; i < ordered.length; i++) {
            const row = ordered[i];
            row.style.setProperty('--dsu-motion-delay', load ? `${staggerDelay(i)}ms` : '0ms');
            // A row the engine already marked may have been reused by the host
            // (same element across conversation switches): drop the classes and
            // force a reflow so the entrance replays on the fresh content.
            if (row.classList.contains(ROW_IN_CLASS)) {
                row.classList.remove(ROW_IN_CLASS, ...STYLE_CLASSES);
                void row.offsetWidth;
            }
            row.classList.add(ROW_IN_CLASS, styleCls);
            marked.add(row);
        }
    }
    function syncEnabled() {
        const next = options.getState();
        if (!anyMotionEnabled(next)) {
            pending = [];
            clearMarked();
        }
        else if (!next.selection && state.selection) {
            // The selection-box toggle turned off: sweep the persistent boxes.
            for (const row of document.querySelectorAll(`.${SELECT_ANIMATION_CLASS}`)) {
                row.classList.remove(SELECT_ANIMATION_CLASS);
            }
        }
        // Style changes only affect rows mounted from now on; already-marked
        // rows keep the animation they started with.
        state = next;
        // Flush whenever anything is active (idempotent): covers the initial
        // scope resolve (buffered first load) and every re-enable after a toggle.
        if (anyMotionEnabled(state)) {
            flush();
            scanTreeBoot();
        }
    }
    /**
     * One-shot boot scan for the sidebar tree: the tree can mount before the
     * engine installs (page-restored session), so its items would never reach
     * the observer. Marks whatever the observer missed with the load stagger,
     * and traces the persistent selection box on the restored active item.
     * Retries briefly until the tree has mounted.
     */
    function scanTreeBoot() {
        if (disposed || !anyMotionEnabled(state))
            return;
        const items = [...document.querySelectorAll(TREE_ITEM)].filter(isTreeItem);
        if (items.length === 0 && bootAttempts < MAX_SWITCH_RETRIES) {
            bootAttempts += 1;
            bootTimer = window.setTimeout(scanTreeBoot, SWITCH_RETRY_MS);
            return;
        }
        if (bootScanned)
            return;
        bootScanned = true;
        const fresh = items.filter((item) => !item.classList.contains(ROW_IN_CLASS));
        if (fresh.length > 0 && state.sidebar)
            applyBatch(fresh, true);
        const selected = items.find((item) => item.getAttribute('aria-selected') === 'true');
        if (selected !== undefined)
            playSelectAnimation(selected);
    }
    function flush() {
        if (pending.length === 0)
            return;
        const now = performance.now();
        const fresh = pending.filter((batch) => now - batch.time <= FRESHNESS_WINDOW_MS);
        for (const batch of fresh) {
            const isTree = batch.rows[0] !== undefined && isTreeItem(batch.rows[0]);
            if (isTree ? !state.sidebar : !state.transcript)
                continue;
            applyBatch(batch.rows, batch.load);
            // Buffered tree batches may carry the restored active item; give it
            // its persistent selection box too (no aria-selected change fires for
            // an item that mounts already selected).
            for (const row of batch.rows) {
                if (isTreeItem(row) && row.getAttribute('aria-selected') === 'true')
                    playSelectAnimation(row);
            }
        }
        pending = [];
    }
    /**
     * Selection-box entrance: the tree item that just became the active
     * conversation fades a selection box in and keeps it (the class stays until
     * the item loses selection). Replays on every visit (the class is
     * force-restarted), independent of row reuse.
     */
    function playSelectAnimation(row) {
        if (disposed || !state.selection)
            return;
        row.classList.remove(SELECT_ANIMATION_CLASS);
        void row.offsetWidth;
        row.classList.add(SELECT_ANIMATION_CLASS);
    }
    const observer = new MutationObserver((mutations) => {
        const byParent = new Map();
        const removedByParent = new Set();
        const touched = [];
        // Rows may be reachable through several mutations in one commit (a
        // subtree mount collects rows their own mutations also report); each row
        // joins exactly one batch, on first sight.
        const seen = new Set();
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                // Sidebar selection changes (conversation switch): trace the box
                // around the item that became active; drop it from the one that
                // lost selection, so the box follows the active item.
                if (mutation.attributeName === 'aria-selected') {
                    const target = mutation.target;
                    if (target instanceof HTMLElement && target.matches(TREE_ITEM)) {
                        if (target.getAttribute('aria-selected') === 'true')
                            playSelectAnimation(target);
                        else
                            target.classList.remove(SELECT_ANIMATION_CLASS);
                    }
                }
                continue;
            }
            if (mutation.type !== 'childList')
                continue;
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement))
                    continue;
                // The host may attach rows inside a wrapper element (sidebar session
                // rows mount inside a span): collect direct rows AND rows nested in
                // the added subtree. (Direct matches, not the type-guard helpers:
                // their `is HTMLElement` predicates would narrow the else branch to
                // never.)
                const rows = [];
                if (node.matches(ANCHOR) || node.matches(TREE_ITEM)) {
                    rows.push(node);
                }
                else {
                    for (const inner of node.querySelectorAll(ITEM_SELECTOR))
                        rows.push(inner);
                }
                for (const row of rows) {
                    if (seen.has(row))
                        continue;
                    seen.add(row);
                    const parent = row.parentElement;
                    if (parent === null)
                        continue;
                    const list = byParent.get(parent);
                    if (list === undefined)
                        byParent.set(parent, [row]);
                    else
                        list.push(row);
                    touched.push(parent);
                }
            }
            for (const node of mutation.removedNodes) {
                if (!(node instanceof HTMLElement))
                    continue;
                const hadItems = node.matches(ANCHOR) || node.querySelector(ANCHOR) !== null
                    || node.matches(TREE_ITEM) || node.querySelector(TREE_ITEM) !== null;
                if (!hadItems)
                    continue;
                // Direct item removal: the items' container is the mutation target
                // (the removed node is detached by the time this callback runs, so
                // its parentElement is null). Wholesale subtree removal (conversation
                // switch): the container is the removed node itself.
                const parent = node.matches(ANCHOR) || node.matches(TREE_ITEM) ? mutation.target : node;
                if (!(parent instanceof Element))
                    continue;
                removedByParent.add(parent);
                touched.push(parent);
            }
        }
        // Decide load vs incremental from the PRE-mutation counts, then refresh.
        const batches = [];
        for (const [parent, rows] of byParent) {
            const wasEmpty = (lastCount.get(parent) ?? 0) === 0;
            batches.push({ rows, load: removedByParent.has(parent) || wasEmpty, time: performance.now() });
        }
        for (const parent of touched) {
            lastCount.set(parent, parent.querySelectorAll(ITEM_SELECTOR).length);
        }
        if (state.transcript || state.sidebar) {
            for (const batch of batches) {
                // Sidebar tree: wholesale loads stagger; incremental batches (group
                // expand, search results) fade in immediately with no delay — rows
                // appear when the group opens. An item that mounts already selected
                // (page-restored session) still gets its persistent selection box,
                // since no aria-selected change fires.
                if (batch.rows[0] !== undefined && isTreeItem(batch.rows[0])) {
                    if (!state.sidebar)
                        continue;
                    applyBatch(batch.rows, batch.load);
                    for (const row of batch.rows) {
                        if (row.getAttribute('aria-selected') === 'true')
                            playSelectAnimation(row);
                    }
                    continue;
                }
                if (state.transcript)
                    applyBatch(batch.rows, batch.load);
            }
        }
        else {
            pending.push(...batches.filter((batch) => {
                if (batch.load)
                    return true;
                // While disabled, only transcript batches are worth buffering.
                return batch.rows[0] !== undefined && !isTreeItem(batch.rows[0]);
            }));
            if (pending.length > MAX_PENDING_BATCHES) {
                pending.splice(0, pending.length - MAX_PENDING_BATCHES);
            }
        }
    });
    // The app renders into #root, so the body exists by the time the plugin
    // applies; the fallback keeps a pre-bootstrap boot from crashing.
    observer.observe(document.body ?? document.documentElement, {
        childList: true,
        subtree: true,
        // The sidebar selection box animation rides aria-selected changes.
        attributes: true,
        attributeFilter: ['aria-selected'],
    });
    const unsubscribe = options.subscribe(syncEnabled);
    syncEnabled(); // initial: flush anything buffered before the first scope read
    /**
     * Force-replay the entrance on the transcript rows (load batch:
     * document-order stagger). Retries briefly while the host is still
     * committing the new transcript, so a slow switch still animates.
     */
    function tryReplay() {
        if (disposed || !anyMotionEnabled(state))
            return;
        const rows = [...document.querySelectorAll(ANCHOR)].filter(isChatRow);
        const flow = document.querySelector('[data-chat-flow]');
        if (rows.length === 0 && flow === null && switchAttempts < MAX_SWITCH_RETRIES) {
            switchAttempts += 1;
            switchTimer = window.setTimeout(tryReplay, SWITCH_RETRY_MS);
            return;
        }
        if (rows.length > 0 && state.transcript)
            applyBatch(rows, true);
        // The transcript column re-enters on every open/switch: one arrival
        // (panel fade + row stagger together).
        if (flow !== null && state.transcript)
            panelEntrance(flow);
    }
    function panelEntrance(el) {
        classEntrance(el, PANEL_ANIMATION_CLASS);
    }
    /** Restart one animation class on an element (drop, reflow, re-add). */
    function classEntrance(el, cls) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
    }
    /**
     * Schedule the blank-session (new conversation) entrance: apply the style
     * class the moment the host renders the welcome dialog into the composer
     * seat. One-shot per signal; a same-frame fallback covers the case where
     * the content was already rendered before the signal arrived.
     */
    function scheduleComposerEntrance(style) {
        const composer = document.querySelector('[data-composer-seat]');
        if (composer === null)
            return;
        let applied = false;
        const apply = () => {
            if (disposed || applied)
                return;
            // Re-resolve the seat: the host may REMOUNT it while the welcome
            // dialog renders, which would orphan the element captured above.
            const current = document.querySelector('[data-composer-seat]');
            if (current === null)
                return;
            applied = true;
            classEntrance(current, styleClass(style));
        };
        // The welcome dialog renders INSIDE the seat (deeper than direct
        // children — the composer stack persists), so observe the whole subtree:
        // the mutation lands in the same microtask as the host's commit (after
        // React's render, before paint) — the class survives React's className
        // management, and the content never paints visible before the entrance
        // starts, so there is no flash.
        const observer = new MutationObserver(() => {
            observer.disconnect();
            const latest = options.getState();
            if (!latest.blank || !latest.newChat)
                return;
            apply();
        });
        observer.observe(composer, { childList: true, subtree: true });
        // Fallback: the welcome dialog may already be rendered (signal arrived
        // after the commit). Gate on a fresh blank read — by next frame the
        // session ledger is settled, and ordinary switches are skipped.
        requestAnimationFrame(() => {
            observer.disconnect();
            const latest = options.getState();
            if (latest.blank && latest.newChat)
                apply();
        });
    }
    return {
        dispose: () => {
            disposed = true;
            observer.disconnect();
            unsubscribe();
            window.clearTimeout(switchTimer);
            window.clearTimeout(bootTimer);
            pending = [];
            clearMarked();
        },
        notifySessionSwitch: () => {
            if (disposed)
                return;
            notifyCount += 1;
            const latest = options.getState();
            if (latest.newChat)
                scheduleComposerEntrance(latest.newChatStyle);
            // Replay the transcript after the host commits the new rows; always
            // replay (interrupting an in-flight entrance is invisible — both end
            // at rest).
            window.clearTimeout(switchTimer);
            switchAttempts = 0;
            switchTimer = window.setTimeout(tryReplay, SWITCH_REPLAY_MS);
        },
    };
}
//# sourceMappingURL=motion.js.map