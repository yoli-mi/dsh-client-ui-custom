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
import { type MotionStyle, type NewChatMotionStyle, type SidebarMotionStyle } from '../../shared.ts';
import './motion.module.css';
/**
 * Selection-box animation class: applied to a sidebar tree item the moment it
 * becomes the active conversation, briefly tracing the selection box around
 * it (see motion.module.css) before the host's static highlight takes over.
 */
export declare const SELECT_ANIMATION_CLASS = "dsu-motion-select";
/**
 * Panel-loading class: applied to the transcript column when a conversation
 * loads or switches — the whole column fades in with a gentle drop while its
 * rows stagger in (see motion.module.css).
 */
export declare const PANEL_ANIMATION_CLASS = "dsu-motion-panel";
/**
 * Entrance classes applied to marked rows. Literal (global) classes on
 * purpose: the engine runs identically in the browser and in jsdom tests,
 * independent of CSS-module processing (the keyframes live in
 * motion.module.css). ROW_IN_CLASS is the "already animated" marker used for
 * reuse detection and cleanup; the style class drives the animation.
 */
export declare const ROW_IN_CLASS = "dsu-motion-row-in";
/** Every entrance style id the engine may apply (transcript + sidebar + new-chat). */
export type EntranceStyle = MotionStyle | SidebarMotionStyle | NewChatMotionStyle;
/**
 * Every style class the engine may apply (for reuse reset + cleanup). The
 * style sets share the `fade` id, so the union is deduplicated.
 */
export declare const STYLE_CLASSES: readonly string[];
/** Pure: the CSS class that carries one style's entrance animation. */
export declare function styleClass(style: EntranceStyle): string;
/** Per-row stagger step on load batches (ms). */
export declare const STAGGER_STEP_MS = 40;
/** Stagger cap: rows beyond this wait no longer (the tail joins together). */
export declare const STAGGER_CAP_MS = 320;
/** Pure: the entrance delay for the i-th row of a load batch (0-based). */
export declare function staggerDelay(index: number): number;
/** Pure: whether an added node is a top-level chat row (not nested in one). */
export declare function isChatRow(node: Node): node is HTMLElement;
/**
 * Pure: whether an added node is a sidebar tree item. Nested items are
 * allowed: session rows live INSIDE their workspace group row (the host
 * nests them), so a top-level-only check would silently drop them.
 */
export declare function isTreeItem(node: Node): node is HTMLElement;
/** Engine wiring: the current feature state (scope-driven). */
export interface MotionEngineState {
    /** Transcript entrance (rows + column panel), gated by motionEnabled. */
    transcript: boolean;
    /** Sidebar tree entrance (initial load + group expand), gated by sidebarMotionEnabled. */
    sidebar: boolean;
    /** Persistent selection-box trace, gated by selectionMotionEnabled. */
    selection: boolean;
    /** Blank-session (new conversation) entrance, gated by newChatMotionEnabled. */
    newChat: boolean;
    /** The entrance style new transcript rows should use. */
    style: MotionStyle;
    /** The entrance style the blank-session (new conversation) dialog uses. */
    newChatStyle: NewChatMotionStyle;
    /** The entrance style new sidebar tree items should use. */
    sidebarStyle: SidebarMotionStyle;
    /**
     * Whether the current session is blank (a brand-new conversation): the
     * composer seat — which hosts the blank-session hero — animates in only
     * for these, so a new conversation's main dialog visibly appears while
     * ordinary switches leave the seat alone.
     */
    blank: boolean;
}
/** Whether any motion toggle is on (the engine stays inert only when all are off). */
export declare function anyMotionEnabled(state: MotionEngineState): boolean;
/** Engine wiring: reads the feature state and subscribes to its changes. */
export interface MotionEngineOptions {
    /** The current feature state (scope-driven). */
    getState: () => MotionEngineState;
    /** Subscribe to state changes (settings scope); returns the disposer. */
    subscribe: (listener: () => void) => () => void;
}
/** The installed engine handle: teardown + the session-switch replay signal. */
export interface MotionEngine {
    /** Tear the engine down (disconnect, unsubscribe, unmark rows). */
    dispose: () => void;
    /**
     * Force-replay the entrance on every mounted row. Called on conversation
     * switches: the host remounts the whole transcript, and this covers every
     * way those rows may reach the DOM (including ones the observer cannot
     * correlate), so every open/switch animates — not just the first.
     */
    notifySessionSwitch: () => void;
}
/**
 * Install the entrance-motion engine. Starts observing immediately (batches
 * buffer while disabled) and returns the engine handle: teardown plus the
 * session-switch replay signal (see {@link MotionEngine}).
 * @param options - feature-state access (scope-driven).
 */
export declare function installConversationEntrance(options: MotionEngineOptions): MotionEngine;
//# sourceMappingURL=motion.d.ts.map