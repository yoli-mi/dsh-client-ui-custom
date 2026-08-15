/** Copy for the history-strip pin ("悬挂") action. */
/** Dictionary namespace owned by the pin entry. */
export declare const PIN_NS = "pin";
/** All pin copy keys. */
export type PinKey = 'pin' | 'pinActive' | 'pinHint';
/** Simplified Chinese copy. */
export declare const zh: Record<PinKey, string>;
/** English copy. */
export declare const en: Record<PinKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The history-strip pin action copy. */
        pin: PinKey;
    }
}
//# sourceMappingURL=pin-locales.d.ts.map