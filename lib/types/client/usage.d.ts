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
export type UsageRange = 'year' | 'month' | 'week' | 'days3';
/** All ranges, in display order. */
export declare const USAGE_RANGES: readonly UsageRange[];
/** Window start (ms epoch); sessions updated at/after it count. */
export declare function rangeStartMs(range: UsageRange, now: number): number;
/** Provider usage bucket for one session (structural mirror of TokenUsageProjection). */
export interface SessionUsage {
    uncachedInputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
}
/** Time/steps bucket for one session (structural mirror of the sessionStats view). */
export interface SessionStats {
    turns: number;
    steps: number;
    llmMs: number;
    toolMs: number;
}
/** One decodable session row. */
export interface SessionUsageRow {
    /** Session activity timestamp (updatedAt). */
    updatedAt: number;
    usage: SessionUsage | null;
    /** Per-model usage buckets, keyed by `${provider}:${model}` (null when the projection has none). */
    byModel: Readonly<Record<string, SessionUsage>> | null;
    stats: SessionStats | null;
}
/** Aggregated figures for one range. */
export interface UsageAggregate {
    sessions: number;
    turns: number;
    steps: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    llmMs: number;
    toolMs: number;
}
/** Zero aggregate. */
export declare const EMPTY_USAGE: UsageAggregate;
/**
 * Decode one session row's projection values into a {@link SessionUsageRow}.
 * @param updatedAt - the session's activity timestamp.
 * @param projectionValues - the row's projectionValues map (may be undefined).
 * @returns the leniently decoded row.
 */
export declare function decodeUsageRow(updatedAt: number, projectionValues: Readonly<Record<string, unknown>> | undefined): SessionUsageRow;
/** Total provider tokens in one usage bucket (all four disjoint buckets). */
export declare function usageTokens(usage: SessionUsage): number;
/**
 * The row's usage slice for a model filter: the per-model buckets when a
 * model key is selected, otherwise the row totals. Null when the slice is
 * unavailable.
 * @param row - a decoded session row.
 * @param modelKey - selected model (`${provider}:${model}`) or null for all models.
 * @returns the usage slice, or null.
 */
export declare function usageOfRow(row: SessionUsageRow, modelKey: string | null): SessionUsage | null;
/**
 * The model keys (in first-seen order) any session reported usage for —
 * the model-selector options.
 * @param rows - decoded session rows.
 * @returns `provider:model` keys, deduplicated in first-seen order.
 */
export declare function usageModelKeys(rows: readonly SessionUsageRow[]): string[];
/**
 * Aggregate session rows whose activity falls inside the range window.
 * @param rows - decoded session rows.
 * @param range - the time window.
 * @param now - reference "now" (ms epoch).
 * @param modelKey - optional model filter (`${provider}:${model}`); null aggregates all models.
 * @returns summed figures.
 */
export declare function aggregateUsage(rows: readonly SessionUsageRow[], range: UsageRange, now: number, modelKey?: string | null): UsageAggregate;
/** One bar of the per-bucket breakdown. */
export interface UsageBucket {
    /** Bucket window start (ms epoch); the component formats the label. */
    start: number;
    tokens: number;
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
export declare function usageByBucket(rows: readonly SessionUsageRow[], range: UsageRange, now: number, modelKey?: string | null): readonly UsageBucket[];
/** Format a token count compactly (1.2k / 3.4M). */
export declare function formatTokens(count: number): string;
/** Format a duration compactly (45s / 12m 30s / 3h 12m). */
export declare function formatDuration(ms: number): string;
//# sourceMappingURL=usage.d.ts.map