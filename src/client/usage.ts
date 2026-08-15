/**
 * App-usage aggregation, pure and client-side.
 *
 * The session list rows already carry host-computed projection baselines
 * (SessionSummary.projectionValues → 'tokenUsage' from dsh-token-meter and
 * 'sessionStats' from dsh-session-stats) plus `updatedAt`, so the usage panel
 * can aggregate provider token usage, cache hits, and model time over any
 * time window without extra RPCs. Decoding is deliberately lenient: an
 * absent or malformed projection simply counts zero.
 */

/** The four selectable time windows. */
export type UsageRange = 'year' | 'month' | 'week' | 'days3'

/** All ranges, in display order. */
export const USAGE_RANGES: readonly UsageRange[] = ['year', 'month', 'week', 'days3']

const DAY_MS = 86_400_000

/** Window start (ms epoch); sessions updated at/after it count. */
export function rangeStartMs(range: UsageRange, now: number): number {
  switch (range) {
    case 'year': return now - 365 * DAY_MS
    case 'month': return now - 30 * DAY_MS
    case 'week': return now - 7 * DAY_MS
    case 'days3': return now - 3 * DAY_MS
  }
}

/** Provider usage bucket for one session (structural mirror of TokenUsageProjection). */
export interface SessionUsage {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/** Time/steps bucket for one session (structural mirror of the sessionStats view). */
export interface SessionStats {
  turns: number
  steps: number
  llmMs: number
  toolMs: number
}

/** One decodable session row. */
export interface SessionUsageRow {
  /** Session activity timestamp (updatedAt). */
  updatedAt: number
  usage: SessionUsage | null
  /** Per-model usage buckets, keyed by `${provider}:${model}` (null when the projection has none). */
  byModel: Readonly<Record<string, SessionUsage>> | null
  stats: SessionStats | null
}

/** Aggregated figures for one range. */
export interface UsageAggregate {
  sessions: number
  turns: number
  steps: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  llmMs: number
  toolMs: number
}

/** Zero aggregate. */
export const EMPTY_USAGE: UsageAggregate = {
  sessions: 0, turns: 0, steps: 0,
  inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
  llmMs: 0, toolMs: 0,
}

const num = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0

/**
 * Decode one session row's projection values into a {@link SessionUsageRow}.
 * @param updatedAt - the session's activity timestamp.
 * @param projectionValues - the row's projectionValues map (may be undefined).
 * @returns the leniently decoded row.
 */
export function decodeUsageRow(
  updatedAt: number,
  projectionValues: Readonly<Record<string, unknown>> | undefined,
): SessionUsageRow {
  const usage = projectionValues?.['tokenUsage']
  const stats = projectionValues?.['sessionStats']
  const decodeBuckets = (value: unknown): SessionUsage | null =>
    value === null || typeof value !== 'object'
      ? null
      : {
        uncachedInputTokens: num((value as { uncachedInputTokens?: unknown }).uncachedInputTokens),
        outputTokens: num((value as { outputTokens?: unknown }).outputTokens),
        cacheReadTokens: num((value as { cacheReadTokens?: unknown }).cacheReadTokens),
        cacheWriteTokens: num((value as { cacheWriteTokens?: unknown }).cacheWriteTokens),
      }
  const byModelRaw = usage !== null && typeof usage === 'object'
    ? (usage as { byModel?: unknown }).byModel
    : undefined
  let byModel: Record<string, SessionUsage> | null = null
  if (byModelRaw !== null && typeof byModelRaw === 'object' && !Array.isArray(byModelRaw)) {
    byModel = {}
    for (const [modelKey, buckets] of Object.entries(byModelRaw)) {
      const decoded = decodeBuckets(buckets)
      if (decoded !== null) byModel[modelKey] = decoded
    }
    if (Object.keys(byModel).length === 0) byModel = null
  }
  return {
    updatedAt,
    usage: decodeBuckets(usage),
    byModel,
    stats: stats === null || typeof stats !== 'object'
      ? null
      : {
        turns: num((stats as { turns?: unknown }).turns),
        steps: num((stats as { steps?: unknown }).steps),
        llmMs: num((stats as { llmMs?: unknown }).llmMs),
        toolMs: num((stats as { toolMs?: unknown }).toolMs),
      },
  }
}

/** Total provider tokens in one usage bucket (all four disjoint buckets). */
export function usageTokens(usage: SessionUsage): number {
  return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens
}

/**
 * The row's usage slice for a model filter: the per-model buckets when a
 * model key is selected, otherwise the row totals. Null when the slice is
 * unavailable.
 * @param row - a decoded session row.
 * @param modelKey - selected model (`${provider}:${model}`) or null for all models.
 * @returns the usage slice, or null.
 */
export function usageOfRow(row: SessionUsageRow, modelKey: string | null): SessionUsage | null {
  if (modelKey === null) return row.usage
  return row.byModel?.[modelKey] ?? null
}

/**
 * The model keys (in first-seen order) any session reported usage for —
 * the model-selector options.
 * @param rows - decoded session rows.
 * @returns `provider:model` keys, deduplicated in first-seen order.
 */
export function usageModelKeys(rows: readonly SessionUsageRow[]): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    if (row.byModel === null) continue
    for (const modelKey of Object.keys(row.byModel)) {
      if (!seen.has(modelKey)) {
        seen.add(modelKey)
        keys.push(modelKey)
      }
    }
  }
  return keys
}

/**
 * Aggregate session rows whose activity falls inside the range window.
 * @param rows - decoded session rows.
 * @param range - the time window.
 * @param now - reference "now" (ms epoch).
 * @param modelKey - optional model filter (`${provider}:${model}`); null aggregates all models.
 * @returns summed figures.
 */
export function aggregateUsage(
  rows: readonly SessionUsageRow[],
  range: UsageRange,
  now: number,
  modelKey: string | null = null,
): UsageAggregate {
  const cutoff = rangeStartMs(range, now)
  const total = { ...EMPTY_USAGE }
  for (const row of rows) {
    if (row.updatedAt < cutoff) continue
    const usage = usageOfRow(row, modelKey)
    // A model filter counts only the sessions that actually used that model.
    if (modelKey !== null && usage === null) continue
    total.sessions += 1
    if (row.stats !== null) {
      total.turns += row.stats.turns
      total.steps += row.stats.steps
      total.llmMs += row.stats.llmMs
      total.toolMs += row.stats.toolMs
    }
    if (usage !== null) {
      total.inputTokens += usage.uncachedInputTokens
      total.outputTokens += usage.outputTokens
      total.cacheReadTokens += usage.cacheReadTokens
      total.cacheWriteTokens += usage.cacheWriteTokens
    }
  }
  return total
}

/** One bar of the per-bucket breakdown. */
export interface UsageBucket {
  /** Bucket window start (ms epoch); the component formats the label. */
  start: number
  tokens: number
}

/**
 * Bucket token totals for a range's bar chart. Adaptive granularity: 12
 * monthly buckets for the year, 4 weekly for the month, daily for week/days3.
 * @param rows - decoded session rows.
 * @param range - the time window.
 * @param now - reference "now".
 * @param modelKey - optional model filter; null aggregates all models.
 * @returns buckets from oldest to newest.
 */
export function usageByBucket(
  rows: readonly SessionUsageRow[],
  range: UsageRange,
  now: number,
  modelKey: string | null = null,
): readonly UsageBucket[] {
  const cutoff = rangeStartMs(range, now)
  const spec = range === 'year'
    ? { count: 12, width: 30 * DAY_MS }
    : range === 'month'
      ? { count: 4, width: 7 * DAY_MS }
      : { count: range === 'week' ? 7 : 3, width: DAY_MS }
  const buckets: UsageBucket[] = new Array(spec.count).fill(0).map((_, index) => ({
    // The LAST bucket starts today (now - 0), so the window covers the
    // current day; an off-by-one here would push today's usage into the
    // "yesterday" bar and leave the oldest day empty.
    start: now - (spec.count - 1 - index) * spec.width,
    tokens: 0,
  }))
  for (const row of rows) {
    if (row.updatedAt < cutoff) continue
    const usage = usageOfRow(row, modelKey)
    if (usage === null) continue
    const age = now - row.updatedAt
    const index = spec.count - 1 - Math.min(spec.count - 1, Math.floor(age / spec.width))
    buckets[index]!.tokens += usageTokens(usage)
  }
  return buckets
}

/** Format a token count compactly (1.2k / 3.4M). */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}

/** Format a duration compactly (45s / 12m 30s / 3h 12m). */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}
