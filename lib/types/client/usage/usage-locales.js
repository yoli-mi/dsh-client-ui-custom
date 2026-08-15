/** Locale dictionaries for the app-usage surface (settings section + overlay). */
/** Dictionary namespace owned by the usage surface. */
export const USAGE_NS = 'usage';
/** Simplified Chinese copy. */
export const zh = {
    nav: '用量',
    title: '用量',
    intro: '按时间窗口查看所用模型的 Token 用量、缓存命中与使用时长，也可切换查看具体某个模型的用量。数据来自各会话的用量投影（token-meter / session-stats）。',
    close: '关闭',
    empty: '该时间范围内暂无用量数据。',
    'model.all': '全部模型',
    'range.year': '近一年',
    'range.month': '近一月',
    'range.week': '近一周',
    'range.days3': '近三天',
    'kpi.total': '总 Token',
    'kpi.input': '输入 Token',
    'kpi.output': '输出 Token',
    'kpi.cache': '缓存命中',
    'kpi.cacheRate': '缓存命中率',
    'kpi.time': '使用时长',
    'kpi.sessions': '会话数',
    'kpi.steps': '执行步数',
    breakdown: '用量趋势',
    topSessions: '会话用量排行',
    topEmpty: '暂无会话用量。',
};
/** English copy. */
export const en = {
    nav: 'Usage',
    title: 'Usage',
    intro: 'Token usage, cache hits, and model time across your sessions, filtered by time window or by a specific model. Data comes from each session\'s usage projections (token-meter / session-stats).',
    close: 'Close',
    empty: 'No usage data in this range yet.',
    'model.all': 'All models',
    'range.year': 'Last year',
    'range.month': 'Last month',
    'range.week': 'Last week',
    'range.days3': 'Last 3 days',
    'kpi.total': 'Total tokens',
    'kpi.input': 'Input tokens',
    'kpi.output': 'Output tokens',
    'kpi.cache': 'Cache hits',
    'kpi.cacheRate': 'Cache hit rate',
    'kpi.time': 'Model time',
    'kpi.sessions': 'Sessions',
    'kpi.steps': 'Steps',
    breakdown: 'Usage trend',
    topSessions: 'Top sessions',
    topEmpty: 'No session usage yet.',
};
//# sourceMappingURL=usage-locales.js.map