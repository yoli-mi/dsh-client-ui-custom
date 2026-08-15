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
/** All ranges, in display order. */
export const USAGE_RANGES = ['year', 'month', 'week', 'days3'];
const DAY_MS = 86_400_000;
/** Window start (ms epoch); sessions updated at/after it count. */
export function rangeStartMs(range, now) {
    switch (range) {
        case 'year': return now - 365 * DAY_MS;
        case 'month': return now - 30 * DAY_MS;
        case 'week': return now - 7 * DAY_MS;
        case 'days3': return now - 3 * DAY_MS;
    }
}
/** Zero aggregate. */
export const EMPTY_USAGE = {
    sessions: 0, turns: 0, steps: 0,
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
    llmMs: 0, toolMs: 0,
};
const num = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
/**
 * Decode one session row's projection values into a {@link SessionUsageRow}.
 * @param updatedAt - the session's activity timestamp.
 * @param projectionValues - the row's projectionValues map (may be undefined).
 * @returns the leniently decoded row.
 */
export function decodeUsageRow(updatedAt, projectionValues) {
    const usage = projectionValues?.['tokenUsage'];
    const stats = projectionValues?.['sessionStats'];
    const decodeBuckets = (value) => value === null || typeof value !== 'object'
        ? null
        : {
            uncachedInputTokens: num(value.uncachedInputTokens),
            outputTokens: num(value.outputTokens),
            cacheReadTokens: num(value.cacheReadTokens),
            cacheWriteTokens: num(value.cacheWriteTokens),
        };
    const byModelRaw = usage !== null && typeof usage === 'object'
        ? usage.byModel
        : undefined;
    let byModel = null;
    if (byModelRaw !== null && typeof byModelRaw === 'object' && !Array.isArray(byModelRaw)) {
        byModel = {};
        for (const [modelKey, buckets] of Object.entries(byModelRaw)) {
            const decoded = decodeBuckets(buckets);
            if (decoded !== null)
                byModel[modelKey] = decoded;
        }
        if (Object.keys(byModel).length === 0)
            byModel = null;
    }
    return {
        updatedAt,
        usage: decodeBuckets(usage),
        byModel,
        stats: stats === null || typeof stats !== 'object'
            ? null
            : {
                turns: num(stats.turns),
                steps: num(stats.steps),
                llmMs: num(stats.llmMs),
                toolMs: num(stats.toolMs),
            },
    };
}
/** Total provider tokens in one usage bucket (all four disjoint buckets). */
export function usageTokens(usage) {
    return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens;
}
/**
 * The row's usage slice for a model filter: the per-model buckets when a
 * model key is selected, otherwise the row totals. Null when the slice is
 * unavailable.
 * @param row - a decoded session row.
 * @param modelKey - selected model (`${provider}:${model}`) or null for all models.
 * @returns the usage slice, or null.
 */
export function usageOfRow(row, modelKey) {
    if (modelKey === null)
        return row.usage;
    return row.byModel?.[modelKey] ?? null;
}
/**
 * The model keys (in first-seen order) any session reported usage for —
 * the model-selector options.
 * @param rows - decoded session rows.
 * @returns `provider:model` keys, deduplicated in first-seen order.
 */
export function usageModelKeys(rows) {
    const keys = [];
    const seen = new Set();
    for (const row of rows) {
        if (row.byModel === null)
            continue;
        for (const modelKey of Object.keys(row.byModel)) {
            if (!seen.has(modelKey)) {
                seen.add(modelKey);
                keys.push(modelKey);
            }
        }
    }
    return keys;
}
/**
 * Aggregate session rows whose activity falls inside the range window.
 * @param rows - decoded session rows.
 * @param range - the time window.
 * @param now - reference "now" (ms epoch).
 * @param modelKey - optional model filter (`${provider}:${model}`); null aggregates all models.
 * @returns summed figures.
 */
export function aggregateUsage(rows, range, now, modelKey = null) {
    const cutoff = rangeStartMs(range, now);
    const total = { ...EMPTY_USAGE };
    for (const row of rows) {
        if (row.updatedAt < cutoff)
            continue;
        const usage = usageOfRow(row, modelKey);
        // A model filter counts only the sessions that actually used that model.
        if (modelKey !== null && usage === null)
            continue;
        total.sessions += 1;
        if (row.stats !== null) {
            total.turns += row.stats.turns;
            total.steps += row.stats.steps;
            total.llmMs += row.stats.llmMs;
            total.toolMs += row.stats.toolMs;
        }
        if (usage !== null) {
            total.inputTokens += usage.uncachedInputTokens;
            total.outputTokens += usage.outputTokens;
            total.cacheReadTokens += usage.cacheReadTokens;
            total.cacheWriteTokens += usage.cacheWriteTokens;
        }
    }
    return total;
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
export function usageByBucket(rows, range, now, modelKey = null) {
    const cutoff = rangeStartMs(range, now);
    const spec = range === 'year'
        ? { count: 12, width: 30 * DAY_MS }
        : range === 'month'
            ? { count: 4, width: 7 * DAY_MS }
            : { count: range === 'week' ? 7 : 3, width: DAY_MS };
    const buckets = new Array(spec.count).fill(0).map((_, index) => ({
        // The LAST bucket starts today (now - 0), so the window covers the
        // current day; an off-by-one here would push today's usage into the
        // "yesterday" bar and leave the oldest day empty.
        start: now - (spec.count - 1 - index) * spec.width,
        tokens: 0,
    }));
    for (const row of rows) {
        if (row.updatedAt < cutoff)
            continue;
        const usage = usageOfRow(row, modelKey);
        if (usage === null)
            continue;
        const age = now - row.updatedAt;
        const index = spec.count - 1 - Math.min(spec.count - 1, Math.floor(age / spec.width));
        buckets[index].tokens += usageTokens(usage);
    }
    return buckets;
}
/** Format a token count compactly (1.2k / 3.4M). */
export function formatTokens(count) {
    if (count >= 1_000_000)
        return `${(count / 1_000_000).toFixed(2)}M`;
    if (count >= 1_000)
        return `${(count / 1_000).toFixed(1)}k`;
    return String(count);
}
/** Format a duration compactly (45s / 12m 30s / 3h 12m). */
export function formatDuration(ms) {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}
//# sourceMappingURL=usage.js.map