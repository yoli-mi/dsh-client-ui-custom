import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** App-usage panel: model filter, time-range tabs, KPI cards, a bar trend, and top sessions. */
import { useState } from 'react';
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { USAGE_RANGES, aggregateUsage, decodeUsageRow, formatDuration, formatTokens, usageByBucket, usageModelKeys, usageOfRow, usageTokens, } from "../usage.js";
import css from './UsagePanel.module.css';
const DAY_MS = 86_400_000;
function bucketLabel(start, range) {
    const date = new Date(start);
    if (range === 'year')
        return date.toLocaleDateString(undefined, { month: 'short' });
    if (range === 'month')
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return date.toLocaleDateString(undefined, { weekday: 'short' });
}
/** Display label for a `provider:model` key. */
const modelLabel = (modelKey) => modelKey.replace(':', ' / ');
/**
 * Render the usage panel content.
 * @param props - sessions hook + translator.
 * @returns the panel element tree.
 */
export function UsagePanel({ useSessions, t }) {
    const list = useSessions((value) => value);
    const [range, setRange] = useState('week');
    const [modelKey, setModelKey] = useState(null);
    const [modelOpen, setModelOpen] = useState(false);
    const now = Date.now();
    const rows = Object.values(list.byId).map((summary) => decodeUsageRow(summary.updatedAt, summary.projectionValues));
    const modelKeys = usageModelKeys(rows);
    // A selected model that no longer has data in the window resets to 全部.
    const activeModel = modelKey !== null && modelKeys.includes(modelKey) ? modelKey : null;
    const total = aggregateUsage(rows, range, now, activeModel);
    const buckets = usageByBucket(rows, range, now, activeModel);
    const maxTokens = Math.max(1, ...buckets.map((bucket) => bucket.tokens));
    const hitTokens = total.cacheReadTokens + total.inputTokens;
    const hitRate = hitTokens === 0 ? 0 : total.cacheReadTokens / hitTokens;
    const top = Object.values(list.byId)
        .map((summary) => {
        const row = decodeUsageRow(summary.updatedAt, summary.projectionValues);
        const usage = usageOfRow(row, activeModel);
        return {
            title: summary.displayTitle,
            updatedAt: summary.updatedAt,
            tokens: usage === null ? 0 : usageTokens(usage),
            // A session that never used the selected model does not rank for it.
            missing: activeModel !== null && usage === null,
        };
    })
        .filter((entry) => !entry.missing && entry.updatedAt >= now - (range === 'year' ? 365 : range === 'month' ? 30 : range === 'week' ? 7 : 3) * DAY_MS)
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 5);
    return (_jsxs("div", { className: css.section, children: [_jsxs("div", { className: css.toolbar, children: [_jsx("div", { className: css.tabs, role: "tablist", "aria-label": "usage range", children: USAGE_RANGES.map((id) => (_jsx("button", { type: "button", role: "tab", "aria-selected": id === range, className: id === range ? `${css.tab} ${css.tabActive}` : css.tab, onClick: () => setRange(id), children: t(`range.${id}`) }, id))) }), modelKeys.length > 0 && (_jsx(Menu, { open: modelOpen, onClose: () => { setModelOpen(false); }, items: [
                            { id: '', label: t('model.all') },
                            ...modelKeys.map(key => ({ id: key, label: modelLabel(key) })),
                        ], selectedId: activeModel ?? '', onSelect: (id) => {
                            setModelOpen(false);
                            setModelKey(id === '' ? null : id);
                        }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.model, "aria-haspopup": "menu", "aria-expanded": modelOpen, onClick: () => { setModelOpen(value => !value); }, children: [activeModel === null ? t('model.all') : modelLabel(activeModel), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) }))] }), total.sessions === 0 && total.inputTokens === 0 && total.outputTokens === 0 ? (_jsx("p", { className: css.empty, children: t('empty') })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.kpis, children: [_jsxs("div", { className: css.kpi, children: [_jsx("span", { className: css.kpiLabel, children: t('kpi.total') }), _jsx("span", { className: css.kpiValue, children: formatTokens(total.inputTokens + total.outputTokens + total.cacheReadTokens + total.cacheWriteTokens) })] }), _jsxs("div", { className: css.kpi, children: [_jsx("span", { className: css.kpiLabel, children: t('kpi.input') }), _jsx("span", { className: css.kpiValue, children: formatTokens(total.inputTokens) }), _jsxs("span", { className: css.kpiSub, children: [formatTokens(total.cacheWriteTokens), " write"] })] }), _jsxs("div", { className: css.kpi, children: [_jsx("span", { className: css.kpiLabel, children: t('kpi.output') }), _jsx("span", { className: css.kpiValue, children: formatTokens(total.outputTokens) })] }), _jsxs("div", { className: css.kpi, children: [_jsx("span", { className: css.kpiLabel, children: t('kpi.cache') }), _jsx("span", { className: css.kpiValue, children: formatTokens(total.cacheReadTokens) }), _jsxs("span", { className: css.kpiSub, children: [t('kpi.cacheRate'), " ", (hitRate * 100).toFixed(1), "%"] })] }), _jsxs("div", { className: css.kpi, children: [_jsx("span", { className: css.kpiLabel, children: t('kpi.time') }), _jsx("span", { className: css.kpiValue, children: formatDuration(total.llmMs) }), _jsxs("span", { className: css.kpiSub, children: [formatDuration(total.toolMs), " tool"] })] }), _jsxs("div", { className: css.kpi, children: [_jsx("span", { className: css.kpiLabel, children: t('kpi.sessions') }), _jsx("span", { className: css.kpiValue, children: total.sessions }), _jsxs("span", { className: css.kpiSub, children: [t('kpi.steps'), " ", total.steps] })] })] }), _jsxs("div", { className: css.breakdown, children: [_jsx("span", { className: css.breakdownLabel, children: t('breakdown') }), _jsx("div", { className: css.bars, children: buckets.map((bucket) => (_jsxs("div", { className: css.barWrap, title: `${formatTokens(bucket.tokens)}`, children: [_jsx("div", { className: css.bar, style: { height: `${Math.max(2, Math.round((bucket.tokens / maxTokens) * 100))}%` } }), _jsx("span", { className: css.barLabel, children: bucketLabel(bucket.start, range) })] }, bucket.start))) })] }), top.length > 0 && (_jsxs("div", { className: css.top, children: [_jsx("span", { className: css.breakdownLabel, children: t('topSessions') }), top.map((entry, index) => (_jsxs("div", { className: css.topRow, children: [_jsx("span", { className: css.topRank, children: index + 1 }), _jsx("span", { className: css.topTitle, children: entry.title }), _jsx("span", { className: css.topTokens, children: formatTokens(entry.tokens) })] }, entry.title + entry.updatedAt)))] }))] }))] }));
}
//# sourceMappingURL=UsagePanel.js.map