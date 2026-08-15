/** Locale dictionaries for the shortcuts settings section. */
/** Dictionary namespace owned by ui-custom's settings section. */
export declare const NS = "shortcuts";
/** All section copy keys. */
export type ShortcutsKey = 'nav' | 'title' | 'intro' | 'newConversation' | 'switchModel' | 'cycleThinking' | 'sendMessage' | 'newline' | 'usagePanel' | 'defaultWorkspaceTitle' | 'defaultWorkspaceDesc' | 'defaultWorkspaceNone' | 'modelShortcutTitle' | 'modelShortcutDesc' | 'modelShortcutEmpty' | 'modelShortcutAdd' | 'modelShortcutRemove' | 'modelShortcutPickTarget' | 'modelCatalogEmpty' | 'modelCatalogUnavailable' | 'comboHint' | 'record' | 'reset' | 'save' | 'saving' | 'dirty' | 'unavailable' | 'unavailableHint';
/** Simplified Chinese copy. */
export declare const zh: Record<ShortcutsKey, string>;
/** English copy. */
export declare const en: Record<ShortcutsKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The shortcuts settings section copy. */
        shortcuts: ShortcutsKey;
    }
}
//# sourceMappingURL=locales.d.ts.map