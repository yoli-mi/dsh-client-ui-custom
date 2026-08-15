/** Copy for the conversation-history strip, its toggle, and the General-settings row. */
/** Dictionary namespace owned by the history surface. */
export declare const HISTORY_NS = "history";
/** All history copy keys, including relative-time templates ({n}/{m}/{d} placeholders). */
export type HistoryKey = 'title' | 'open' | 'close' | 'noText' | 'jumpSegment' | 'positionTitle' | 'positionDesc' | 'positionLeft' | 'positionRight' | 'positionOff' | 'limitTitle' | 'limitDesc' | 'limit5' | 'limit10' | 'limit20' | 'limitAll' | 'justNow' | 'minutes' | 'hours' | 'days' | 'date';
/** Locale-aware relative-time templates fed to formatRelativeTime. */
export interface RelativeTimeCopy {
    justNow: string;
    minutes: string;
    hours: string;
    days: string;
    date: string;
}
/** Simplified Chinese copy. */
export declare const zh: Record<HistoryKey, string>;
/** English copy. */
export declare const en: Record<HistoryKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The conversation-history surface copy. */
        history: HistoryKey;
    }
}
//# sourceMappingURL=history-locales.d.ts.map