/** App-usage panel: model filter, time-range tabs, KPI cards, a bar trend, and top sessions. */

import { useState } from 'react'
import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  USAGE_RANGES, aggregateUsage, decodeUsageRow, formatDuration, formatTokens,
  usageByBucket, usageModelKeys, usageOfRow, usageTokens, type UsageRange,
} from '../usage.ts'
import css from './UsagePanel.module.css'

/** Props shared by the settings section and the overlay panel. */
export interface UsagePanelProps {
  /** Bound hook over the sessions list (rendered by the renderer). */
  useSessions: SnapshotSelectorHook<SessionListState>
  /** Bound translator for the usage namespace. */
  t: TranslateNS<'usage'>
}

const DAY_MS = 86_400_000

function bucketLabel(start: number, range: UsageRange): string {
  const date = new Date(start)
  if (range === 'year') return date.toLocaleDateString(undefined, { month: 'short' })
  if (range === 'month') return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

/** Display label for a `provider:model` key. */
const modelLabel = (modelKey: string): string => modelKey.replace(':', ' / ')

/**
 * Render the usage panel content.
 * @param props - sessions hook + translator.
 * @returns the panel element tree.
 */
export function UsagePanel({ useSessions, t }: UsagePanelProps) {
  const list = useSessions((value) => value)
  const [range, setRange] = useState<UsageRange>('week')
  const [modelKey, setModelKey] = useState<string | null>(null)
  const [modelOpen, setModelOpen] = useState(false)
  const now = Date.now()
  const rows = Object.values(list.byId).map((summary) =>
    decodeUsageRow(summary.updatedAt, summary.projectionValues))
  const modelKeys = usageModelKeys(rows)
  // A selected model that no longer has data in the window resets to 全部.
  const activeModel = modelKey !== null && modelKeys.includes(modelKey) ? modelKey : null
  const total = aggregateUsage(rows, range, now, activeModel)
  const buckets = usageByBucket(rows, range, now, activeModel)
  const maxTokens = Math.max(1, ...buckets.map((bucket) => bucket.tokens))
  const hitTokens = total.cacheReadTokens + total.inputTokens
  const hitRate = hitTokens === 0 ? 0 : total.cacheReadTokens / hitTokens

  const top = Object.values(list.byId)
    .map((summary) => {
      const row = decodeUsageRow(summary.updatedAt, summary.projectionValues)
      const usage = usageOfRow(row, activeModel)
      return {
        title: summary.displayTitle,
        updatedAt: summary.updatedAt,
        tokens: usage === null ? 0 : usageTokens(usage),
        // A session that never used the selected model does not rank for it.
        missing: activeModel !== null && usage === null,
      }
    })
    .filter((entry) => !entry.missing && entry.updatedAt >= now - (range === 'year' ? 365 : range === 'month' ? 30 : range === 'week' ? 7 : 3) * DAY_MS)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 5)

  return (
    <div className={css.section}>
      <div className={css.toolbar}>
        <div className={css.tabs} role="tablist" aria-label="usage range">
          {USAGE_RANGES.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === range}
              className={id === range ? `${css.tab} ${css.tabActive}` : css.tab}
              onClick={() => setRange(id)}
            >
              {t(`range.${id}`)}
            </button>
          ))}
        </div>
        {modelKeys.length > 0 && (
          <Menu
            open={modelOpen}
            onClose={() => { setModelOpen(false) }}
            items={[
              { id: '', label: t('model.all') },
              ...modelKeys.map(key => ({ id: key, label: modelLabel(key) })),
            ]}
            selectedId={activeModel ?? ''}
            onSelect={(id) => {
              setModelOpen(false)
              setModelKey(id === '' ? null : id)
            }}
            align="end"
            portal
            anchor={(
              <button
                type="button"
                className={css.model}
                aria-haspopup="menu"
                aria-expanded={modelOpen}
                onClick={() => { setModelOpen(value => !value) }}
              >
                {activeModel === null ? t('model.all') : modelLabel(activeModel)}
                <IconChevronDownOutline14 className={css.chevron} />
              </button>
            )}
          />
        )}
      </div>

      {total.sessions === 0 && total.inputTokens === 0 && total.outputTokens === 0 ? (
        <p className={css.empty}>{t('empty')}</p>
      ) : (
        <>
          <div className={css.kpis}>
            <div className={css.kpi}>
              <span className={css.kpiLabel}>{t('kpi.total')}</span>
              <span className={css.kpiValue}>{formatTokens(total.inputTokens + total.outputTokens + total.cacheReadTokens + total.cacheWriteTokens)}</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}>{t('kpi.input')}</span>
              <span className={css.kpiValue}>{formatTokens(total.inputTokens)}</span>
              <span className={css.kpiSub}>{formatTokens(total.cacheWriteTokens)} write</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}>{t('kpi.output')}</span>
              <span className={css.kpiValue}>{formatTokens(total.outputTokens)}</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}>{t('kpi.cache')}</span>
              <span className={css.kpiValue}>{formatTokens(total.cacheReadTokens)}</span>
              <span className={css.kpiSub}>{t('kpi.cacheRate')} {(hitRate * 100).toFixed(1)}%</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}>{t('kpi.time')}</span>
              <span className={css.kpiValue}>{formatDuration(total.llmMs)}</span>
              <span className={css.kpiSub}>{formatDuration(total.toolMs)} tool</span>
            </div>
            <div className={css.kpi}>
              <span className={css.kpiLabel}>{t('kpi.sessions')}</span>
              <span className={css.kpiValue}>{total.sessions}</span>
              <span className={css.kpiSub}>{t('kpi.steps')} {total.steps}</span>
            </div>
          </div>

          <div className={css.breakdown}>
            <span className={css.breakdownLabel}>{t('breakdown')}</span>
            <div className={css.bars}>
              {buckets.map((bucket) => (
                <div key={bucket.start} className={css.barWrap} title={`${formatTokens(bucket.tokens)}`}>
                  <div
                    className={css.bar}
                    style={{ height: `${Math.max(2, Math.round((bucket.tokens / maxTokens) * 100))}%` }}
                  />
                  <span className={css.barLabel}>{bucketLabel(bucket.start, range)}</span>
                </div>
              ))}
            </div>
          </div>

          {top.length > 0 && (
            <div className={css.top}>
              <span className={css.breakdownLabel}>{t('topSessions')}</span>
              {top.map((entry, index) => (
                <div key={entry.title + entry.updatedAt} className={css.topRow}>
                  <span className={css.topRank}>{index + 1}</span>
                  <span className={css.topTitle}>{entry.title}</span>
                  <span className={css.topTokens}>{formatTokens(entry.tokens)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
