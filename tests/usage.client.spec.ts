// @vitest-environment node
/**
 * ui-custom usage aggregation (usage.ts): pure windowing, decoding, summing,
 * bucketing, and formatters. No DOM — feeds synthetic rows.
 */
import { describe, expect, it } from 'vitest'
import {
  EMPTY_USAGE, aggregateUsage, decodeUsageRow, formatDuration, formatTokens,
  rangeStartMs, usageByBucket, usageModelKeys, usageTokens,
} from '../src/client/usage.ts'

const NOW = 1_800_000_000_000

const row = (
  ageMs: number,
  usage?: { uncachedInputTokens?: number; outputTokens?: number; cacheReadTokens?: number; cacheWriteTokens?: number },
  stats?: { turns?: number; steps?: number; llmMs?: number; toolMs?: number },
) => decodeUsageRow(NOW - ageMs, {
  tokenUsage: usage,
  sessionStats: stats,
})

describe('rangeStartMs', () => {
  it('computes the four windows', () => {
    expect(rangeStartMs('days3', NOW)).toBe(NOW - 3 * 86_400_000)
    expect(rangeStartMs('week', NOW)).toBe(NOW - 7 * 86_400_000)
    expect(rangeStartMs('month', NOW)).toBe(NOW - 30 * 86_400_000)
    expect(rangeStartMs('year', NOW)).toBe(NOW - 365 * 86_400_000)
  })
})

describe('decodeUsageRow', () => {
  it('decodes leniently and ignores malformed projections', () => {
    const good = decodeUsageRow(1, { tokenUsage: { uncachedInputTokens: 10, outputTokens: 5, cacheReadTokens: 3, cacheWriteTokens: 2 }, sessionStats: { llmMs: 4000, steps: 3 } })
    expect(good.usage).toEqual({ uncachedInputTokens: 10, outputTokens: 5, cacheReadTokens: 3, cacheWriteTokens: 2 })
    expect(good.stats?.llmMs).toBe(4000)
    const bad = decodeUsageRow(1, { tokenUsage: { uncachedInputTokens: -1, outputTokens: 'x' }, sessionStats: 42 })
    expect(bad.usage?.uncachedInputTokens).toBe(0)
    expect(bad.stats).toBeNull()
    expect(decodeUsageRow(1, undefined).usage).toBeNull()
  })
})

describe('aggregateUsage', () => {
  it('sums only rows inside the window', () => {
    const rows = [
      row(1, { uncachedInputTokens: 100, outputTokens: 50, cacheReadTokens: 20, cacheWriteTokens: 10 }, { llmMs: 60_000, steps: 2 }),
      row(5 * 86_400_000, { uncachedInputTokens: 10, outputTokens: 5 }, { llmMs: 30_000 }),
      row(400 * 86_400_000, { uncachedInputTokens: 999, outputTokens: 999 }), // outside the month window
    ]
    const total = aggregateUsage(rows, 'month', NOW)
    expect(total.sessions).toBe(2)
    expect(total.inputTokens).toBe(110)
    expect(total.outputTokens).toBe(55)
    expect(total.cacheReadTokens).toBe(20)
    expect(total.cacheWriteTokens).toBe(10)
    expect(total.llmMs).toBe(90_000)
    expect(total.steps).toBe(2)
  })

  it('returns the zero aggregate for empty input', () => {
    expect(aggregateUsage([], 'week', NOW)).toEqual(EMPTY_USAGE)
  })
})

describe('usageByBucket', () => {
  it('buckets token totals from oldest to newest', () => {
    const rows = [
      row(1, { uncachedInputTokens: 10, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }),
      row(2 * 86_400_000, { uncachedInputTokens: 90, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }),
      row(9 * 86_400_000, { uncachedInputTokens: 500, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }), // outside the week
    ]
    const buckets = usageByBucket(rows, 'week', NOW)
    expect(buckets).toHaveLength(7)
    const tokens = buckets.map((bucket) => bucket.tokens)
    expect(tokens[6]).toBe(10) // newest day (age < 1 day)
    expect(tokens[4]).toBe(90) // two days ago (index = 7-1-2)
    expect(tokens[0]).toBe(0) // oldest day has nothing
    expect(tokens.reduce((sum, value) => sum + value, 0)).toBe(100)
  })

  it('places the current day in the LAST bar (today is never "yesterday")', () => {
    const buckets = usageByBucket([
      row(1, { uncachedInputTokens: 40 }),                 // today
      row(25 * 3_600_000, { uncachedInputTokens: 60 }),    // yesterday
    ], 'week', NOW)
    expect(buckets[6]!.tokens).toBe(40) // the current day's bar
    expect(buckets[5]!.tokens).toBe(60) // the previous day's bar
    // Window geometry: the last bar starts today, the first covers the oldest day.
    expect(buckets[6]!.start).toBe(NOW)
    expect(buckets[0]!.start).toBe(NOW - 6 * 86_400_000)
    expect(buckets[1]!.start).toBe(buckets[0]!.start + 86_400_000)
  })
})

describe('per-model usage', () => {
  const byModelRow = (
    ageMs: number,
    byModel: Record<string, { uncachedInputTokens?: number; outputTokens?: number }>,
  ) => {
    // The projection's top-level buckets are the sum across models.
    let input = 0
    let output = 0
    for (const buckets of Object.values(byModel)) {
      input += buckets.uncachedInputTokens ?? 0
      output += buckets.outputTokens ?? 0
    }
    return decodeUsageRow(NOW - ageMs, {
      tokenUsage: {
        uncachedInputTokens: input, outputTokens: output, cacheReadTokens: 0, cacheWriteTokens: 0,
        byModel,
      },
    })
  }

  it('decodes the per-model buckets alongside the totals', () => {
    const decoded = decodeUsageRow(1, {
      tokenUsage: {
        uncachedInputTokens: 100, outputTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0,
        byModel: {
          'p:a': { uncachedInputTokens: 60, outputTokens: 30, cacheReadTokens: 0, cacheWriteTokens: 0 },
          'p:b': { uncachedInputTokens: 40, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0 },
        },
      },
    })
    expect(decoded.usage?.uncachedInputTokens).toBe(100)
    expect(decoded.byModel?.['p:a']?.uncachedInputTokens).toBe(60)
    expect(decoded.byModel?.['p:b']?.outputTokens).toBe(20)
    expect(decodeUsageRow(1, { tokenUsage: { uncachedInputTokens: 5, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 } }).byModel).toBeNull()
  })

  it('aggregates a specific model only', () => {
    const rows = [
      byModelRow(1, { 'p:a': { uncachedInputTokens: 60, outputTokens: 30 }, 'p:b': { uncachedInputTokens: 40, outputTokens: 20 } }),
      byModelRow(2 * 86_400_000, { 'p:a': { uncachedInputTokens: 10, outputTokens: 5 } }),
    ]
    const total = aggregateUsage(rows, 'week', NOW, 'p:b')
    expect(total.sessions).toBe(1) // only the row with p:b usage counts
    expect(total.inputTokens).toBe(40)
    expect(total.outputTokens).toBe(20)
    expect(aggregateUsage(rows, 'week', NOW, null).inputTokens).toBe(110)
  })

  it('lists the model keys in first-seen order', () => {
    const rows = [
      byModelRow(1, { 'p:b': { uncachedInputTokens: 1 } }),
      byModelRow(2, { 'p:a': { uncachedInputTokens: 1 }, 'p:b': { uncachedInputTokens: 2 } }),
      decodeUsageRow(3, undefined),
    ]
    expect(usageModelKeys(rows)).toEqual(['p:b', 'p:a'])
    expect(usageModelKeys([])).toEqual([])
  })
})

describe('usageTokens / formatters', () => {
  it('sums the four disjoint buckets', () => {
    expect(usageTokens({ uncachedInputTokens: 10, outputTokens: 5, cacheReadTokens: 3, cacheWriteTokens: 2 })).toBe(20)
  })

  it('formats token counts and durations compactly', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(1_234)).toBe('1.2k')
    expect(formatTokens(3_456_789)).toBe('3.46M')
    expect(formatDuration(30_000)).toBe('30s')
    expect(formatDuration(750_000)).toBe('12m 30s')
    expect(formatDuration(12_000_000)).toBe('3h 20m')
  })
})
