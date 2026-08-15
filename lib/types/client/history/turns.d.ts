/**
 * Conversation-history model: turns the mounted Chat snapshot into the
 * right-column history list (one row per user turn, with the turn's start
 * time) and performs the jump (DOM scroll + flash marker).
 *
 * A "turn" is one user question plus everything that followed it. Node keys
 * are opaque engine-owned identities — the same key rides the
 * `data-chat-anchor-key` attribute on every mounted chat row, so a turn key
 * addresses its DOM row directly. Payloads are read defensively (the plugin
 * deliberately does not import ui-conversation's node data map).
 */
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { RelativeTimeCopy } from './history-locales.ts';
/** One history row: a user turn within the mounted window. */
export interface HistoryTurn {
    /** Chat node key of the turn-opening user message (the jump anchor). */
    key: string;
    /** 1-based turn index in the loaded window. */
    index: number;
    /** First lines of the user message text ('' when the message has no text). */
    question: string;
    /** Epoch ms of the turn start (the user message time); undefined when unavailable. */
    time: number | undefined;
    /** Engine-owned turn number (stable per session); undefined when the node has no turn location. */
    turn: number | undefined;
}
/**
 * First text preview of a chat node payload: user/steering messages carry
 * `content` blocks, assistant messages carry `blocks`. Everything else reads
 * as ''. Structural narrowing only — never throws on unknown payload shapes.
 */
export declare function previewOfNode(kind: string, data: unknown): string;
/**
 * Build the mounted history list from a Chat snapshot. Rows open at
 * user/steering messages; the turn start time (when resolvable) rides along.
 * Only nodes currently mounted in the window are listed — older paginated
 * history is reachable through the window pager (see HistoryStrip).
 */
export declare function buildTurns(snapshot: ChatSnapshot): HistoryTurn[];
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
export declare function mergeVisibleTurns(turns: readonly HistoryTurn[], limit: number, pinned: ReadonlySet<number>): HistoryTurn[];
/** Locate the mounted chat row for a node key (opaque engine key). */
export declare function findAnchorRow(key: string): HTMLElement | null;
/**
 * Smoothly scroll the conversation to a turn and flash a transient accent
 * marker on its row. No-op when the row is not mounted (paged out).
 * @param key - the turn's chat node key.
 */
export declare function jumpToTurn(key: string): void;
/**
 * Pick the turn the reader is currently in: the last turn whose chat row top
 * has scrolled past the reading offset (below the app header). Falls back to
 * the topmost mounted row when none has reached the offset, so the history
 * always highlights one row while the conversation is on screen.
 * @param keys - turn keys, in history order.
 * @returns the current turn key, or null when no turn row is mounted.
 */
export declare function currentTurnKey(keys: readonly string[]): string | null;
/** Format a turn start time as a compact relative label (locale-aware). */
export declare function formatRelativeTime(epochMs: number, copy: RelativeTimeCopy, now?: number): string;
//# sourceMappingURL=turns.d.ts.map