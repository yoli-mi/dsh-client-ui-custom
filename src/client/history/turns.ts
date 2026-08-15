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
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { RelativeTimeCopy } from './history-locales.ts'

/** One history row: a user turn within the mounted window. */
export interface HistoryTurn {
  /** Chat node key of the turn-opening user message (the jump anchor). */
  key: string
  /** 1-based turn index in the loaded window. */
  index: number
  /** First lines of the user message text ('' when the message has no text). */
  question: string
  /** Epoch ms of the turn start (the user message time); undefined when unavailable. */
  time: number | undefined
  /** Engine-owned turn number (stable per session); undefined when the node has no turn location. */
  turn: number | undefined
}

/** Preview length cap before ellipsis. */
const PREVIEW_LIMIT = 60

/** Read a text block's text defensively. Content blocks carry `type: 'text'`,
 * assistant blocks carry `kind: 'text'` — accept both shapes. */
function blockText(block: unknown): string | null {
  if (typeof block !== 'object' || block === null) return null
  const candidate = block as { type?: unknown; kind?: unknown; text?: unknown }
  const isText = candidate.type === 'text' || candidate.kind === 'text'
  return isText && typeof candidate.text === 'string' ? candidate.text : null
}

/** Join block texts into one whitespace-normalized preview, capped + ellipsized. */
function joinPreview(chunks: readonly unknown[]): string {
  const text = chunks
    .map(blockText)
    .filter((chunk): chunk is string => chunk !== null)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text
}

/**
 * First text preview of a chat node payload: user/steering messages carry
 * `content` blocks, assistant messages carry `blocks`. Everything else reads
 * as ''. Structural narrowing only — never throws on unknown payload shapes.
 */
export function previewOfNode(kind: string, data: unknown): string {
  if (typeof data !== 'object' || data === null) return ''
  const payload = data as { content?: unknown; blocks?: unknown }
  if (kind === 'user' || kind === 'steering') {
    return Array.isArray(payload.content) ? joinPreview(payload.content) : ''
  }
  if (kind === 'assistant') {
    return Array.isArray(payload.blocks) ? joinPreview(payload.blocks) : ''
  }
  return ''
}

/** The turn number a node belongs to, from its engine location ('' path = none). */
function nodeTurn(node: { location?: unknown }): number | undefined {
  const location = node.location
  if (typeof location !== 'object' || location === null) return undefined
  const loc = location as { kind?: unknown; turn?: { turn?: unknown } }
  if (loc.kind !== 'turn' && loc.kind !== 'step') return undefined
  const turn = loc.turn?.turn
  return typeof turn === 'number' ? turn : undefined
}

/**
 * Build the mounted history list from a Chat snapshot. Rows open at
 * user/steering messages; the turn start time (when resolvable) rides along.
 * Only nodes currently mounted in the window are listed — older paginated
 * history is reachable through the window pager (see HistoryStrip).
 */
export function buildTurns(snapshot: ChatSnapshot): HistoryTurn[] {
  const turns: HistoryTurn[] = []
  for (const key of snapshot.order) {
    const node = snapshot.nodes.get(key)
    if (node === undefined) continue
    if (node.kind !== 'user' && node.kind !== 'steering') continue
    const turnNumber = nodeTurn(node)
    const time = turnNumber === undefined
      ? undefined
      : snapshot.legacy.turnTimings.get(turnNumber)?.startTime
    turns.push({
      key,
      index: turns.length + 1,
      question: previewOfNode(node.kind, node.data),
      time,
      turn: turnNumber,
    })
  }
  return turns
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
export function mergeVisibleTurns(
  turns: readonly HistoryTurn[],
  limit: number,
  pinned: ReadonlySet<number>,
): HistoryTurn[] {
  if (limit <= 0) return [...turns]
  const pinnedTurns = turns.filter(turn => turn.turn !== undefined && pinned.has(turn.turn))
  const rest = turns.filter(turn => turn.turn === undefined || !pinned.has(turn.turn))
  return [...pinnedTurns, ...rest.slice(-limit)].sort((a, b) => a.index - b.index)
}

/** Locate the mounted chat row for a node key (opaque engine key). */
export function findAnchorRow(key: string): HTMLElement | null {
  for (const row of document.querySelectorAll<HTMLElement>('[data-chat-anchor-key]')) {
    if (row.dataset.chatAnchorKey === key) return row
  }
  return null
}

/**
 * Smoothly scroll the conversation to a turn and flash a transient accent
 * marker on its row. No-op when the row is not mounted (paged out).
 * @param key - the turn's chat node key.
 */
export function jumpToTurn(key: string): void {
  const row = findAnchorRow(key)
  if (row === null) return
  row.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const previousShadow = row.style.boxShadow
  row.style.transition = 'box-shadow 240ms ease'
  row.style.boxShadow = 'inset 3px 0 0 0 var(--dsu-accent, var(--dsw-alias-brand-primary))'
  window.setTimeout(() => {
    row.style.boxShadow = previousShadow
    row.style.transition = ''
  }, 1600)
}

/**
 * Pick the turn the reader is currently in: the last turn whose chat row top
 * has scrolled past the reading offset (below the app header). Falls back to
 * the topmost mounted row when none has reached the offset, so the history
 * always highlights one row while the conversation is on screen.
 * @param keys - turn keys, in history order.
 * @returns the current turn key, or null when no turn row is mounted.
 */
export function currentTurnKey(keys: readonly string[]): string | null {
  const OFFSET = 120
  // Query the anchor rows ONCE and index by key: findAnchorRow re-scans the
  // whole list per key, which on a long conversation is 35× thousands of
  // nodes every scroll frame — the single biggest jank source.
  const byKey = new Map<string, HTMLElement>()
  for (const row of document.querySelectorAll<HTMLElement>('[data-chat-anchor-key]')) {
    const key = row.dataset.chatAnchorKey
    if (key !== undefined) byKey.set(key, row)
  }
  let current: string | null = null
  let topmost: { key: string; top: number } | null = null
  for (const key of keys) {
    const row = byKey.get(key)
    if (row === undefined) continue
    const top = row.getBoundingClientRect().top
    if (topmost === null || top < topmost.top) topmost = { key, top }
    if (top <= OFFSET) current = key
  }
  return current ?? topmost?.key ?? null
}

/** Format a turn start time as a compact relative label (locale-aware). */
export function formatRelativeTime(epochMs: number, copy: RelativeTimeCopy, now: number = Date.now()): string {
  const diff = now - epochMs
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return copy.justNow
  if (diff < hour) return copy.minutes.replace('{n}', String(Math.max(1, Math.floor(diff / minute))))
  if (diff < day) return copy.hours.replace('{n}', String(Math.floor(diff / hour)))
  if (diff < 7 * day) return copy.days.replace('{n}', String(Math.floor(diff / day)))
  const date = new Date(epochMs)
  return copy.date.replace('{m}', String(date.getMonth() + 1)).replace('{d}', String(date.getDate()))
}
