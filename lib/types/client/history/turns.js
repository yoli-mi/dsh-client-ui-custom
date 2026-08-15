/** Preview length cap before ellipsis. */
const PREVIEW_LIMIT = 60;
/** Read a text block's text defensively. Content blocks carry `type: 'text'`,
 * assistant blocks carry `kind: 'text'` — accept both shapes. */
function blockText(block) {
    if (typeof block !== 'object' || block === null)
        return null;
    const candidate = block;
    const isText = candidate.type === 'text' || candidate.kind === 'text';
    return isText && typeof candidate.text === 'string' ? candidate.text : null;
}
/** Join block texts into one whitespace-normalized preview, capped + ellipsized. */
function joinPreview(chunks) {
    const text = chunks
        .map(blockText)
        .filter((chunk) => chunk !== null)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text;
}
/**
 * First text preview of a chat node payload: user/steering messages carry
 * `content` blocks, assistant messages carry `blocks`. Everything else reads
 * as ''. Structural narrowing only — never throws on unknown payload shapes.
 */
export function previewOfNode(kind, data) {
    if (typeof data !== 'object' || data === null)
        return '';
    const payload = data;
    if (kind === 'user' || kind === 'steering') {
        return Array.isArray(payload.content) ? joinPreview(payload.content) : '';
    }
    if (kind === 'assistant') {
        return Array.isArray(payload.blocks) ? joinPreview(payload.blocks) : '';
    }
    return '';
}
/** The turn number a node belongs to, from its engine location ('' path = none). */
function nodeTurn(node) {
    const location = node.location;
    if (typeof location !== 'object' || location === null)
        return undefined;
    const loc = location;
    if (loc.kind !== 'turn' && loc.kind !== 'step')
        return undefined;
    const turn = loc.turn?.turn;
    return typeof turn === 'number' ? turn : undefined;
}
/**
 * Build the mounted history list from a Chat snapshot. Rows open at
 * user/steering messages; the turn start time (when resolvable) rides along.
 * Only nodes currently mounted in the window are listed — older paginated
 * history is reachable through the window pager (see HistoryStrip).
 */
export function buildTurns(snapshot) {
    const turns = [];
    for (const key of snapshot.order) {
        const node = snapshot.nodes.get(key);
        if (node === undefined)
            continue;
        if (node.kind !== 'user' && node.kind !== 'steering')
            continue;
        const turnNumber = nodeTurn(node);
        const time = turnNumber === undefined
            ? undefined
            : snapshot.legacy.turnTimings.get(turnNumber)?.startTime;
        turns.push({
            key,
            index: turns.length + 1,
            question: previewOfNode(node.kind, node.data),
            time,
            turn: turnNumber,
        });
    }
    return turns;
}
/**
 * The strip's visible turns: the recent-turns limit applied to the
 * NON-pinned turns, with every pinned turn merged back at its natural
 * position (pinned turns ignore the count limit). A zero limit shows all
 * turns. The result keeps the window's chronological order.
 * @param turns - all mounted turns (in window order).
 * @param limit - recent-turns count (0 = show all).
 * @param pinned - pinned turn numbers for the current session.
 * @returns the visible turns, in window order.
 */
export function mergeVisibleTurns(turns, limit, pinned) {
    if (limit <= 0)
        return [...turns];
    const pinnedTurns = turns.filter(turn => turn.turn !== undefined && pinned.has(turn.turn));
    const rest = turns.filter(turn => turn.turn === undefined || !pinned.has(turn.turn));
    return [...pinnedTurns, ...rest.slice(-limit)].sort((a, b) => a.index - b.index);
}
/** Locate the mounted chat row for a node key (opaque engine key). */
export function findAnchorRow(key) {
    for (const row of document.querySelectorAll('[data-chat-anchor-key]')) {
        if (row.dataset.chatAnchorKey === key)
            return row;
    }
    return null;
}
/**
 * Smoothly scroll the conversation to a turn and flash a transient accent
 * marker on its row. No-op when the row is not mounted (paged out).
 * @param key - the turn's chat node key.
 */
export function jumpToTurn(key) {
    const row = findAnchorRow(key);
    if (row === null)
        return;
    row.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const previousShadow = row.style.boxShadow;
    row.style.transition = 'box-shadow 240ms ease';
    row.style.boxShadow = 'inset 3px 0 0 0 var(--dsu-accent, var(--dsw-alias-brand-primary))';
    window.setTimeout(() => {
        row.style.boxShadow = previousShadow;
        row.style.transition = '';
    }, 1600);
}
/**
 * Pick the turn the reader is currently in: the last turn whose chat row top
 * has scrolled past the reading offset (below the app header). Falls back to
 * the topmost mounted row when none has reached the offset, so the history
 * always highlights one row while the conversation is on screen.
 * @param keys - turn keys, in history order.
 * @returns the current turn key, or null when no turn row is mounted.
 */
export function currentTurnKey(keys) {
    const OFFSET = 120;
    // Query the anchor rows ONCE and index by key: findAnchorRow re-scans the
    // whole list per key, which on a long conversation is 35× thousands of
    // nodes every scroll frame — the single biggest jank source.
    const byKey = new Map();
    for (const row of document.querySelectorAll('[data-chat-anchor-key]')) {
        const key = row.dataset.chatAnchorKey;
        if (key !== undefined)
            byKey.set(key, row);
    }
    let current = null;
    let topmost = null;
    for (const key of keys) {
        const row = byKey.get(key);
        if (row === undefined)
            continue;
        const top = row.getBoundingClientRect().top;
        if (topmost === null || top < topmost.top)
            topmost = { key, top };
        if (top <= OFFSET)
            current = key;
    }
    return current ?? topmost?.key ?? null;
}
/** Format a turn start time as a compact relative label (locale-aware). */
export function formatRelativeTime(epochMs, copy, now = Date.now()) {
    const diff = now - epochMs;
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute)
        return copy.justNow;
    if (diff < hour)
        return copy.minutes.replace('{n}', String(Math.max(1, Math.floor(diff / minute))));
    if (diff < day)
        return copy.hours.replace('{n}', String(Math.floor(diff / hour)));
    if (diff < 7 * day)
        return copy.days.replace('{n}', String(Math.floor(diff / day)));
    const date = new Date(epochMs);
    return copy.date.replace('{m}', String(date.getMonth() + 1)).replace('{d}', String(date.getDate()));
}
//# sourceMappingURL=turns.js.map