/** Locale dictionaries for the app-usage surface (settings section + overlay). */
/** Dictionary namespace owned by the usage surface. */
export declare const USAGE_NS = "usage";
/** All usage copy keys. */
export type UsageKey = 'nav' | 'title' | 'intro' | 'close' | 'empty' | 'model.all' | 'range.year' | 'range.month' | 'range.week' | 'range.days3' | 'kpi.total' | 'kpi.input' | 'kpi.output' | 'kpi.cache' | 'kpi.cacheRate' | 'kpi.time' | 'kpi.sessions' | 'kpi.steps' | 'breakdown' | 'topSessions' | 'topEmpty';
/** Simplified Chinese copy. */
export declare const zh: Record<UsageKey, string>;
/** English copy. */
export declare const en: Record<UsageKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The app-usage surface copy. */
        usage: UsageKey;
    }
}
//# sourceMappingURL=usage-locales.d.ts.map