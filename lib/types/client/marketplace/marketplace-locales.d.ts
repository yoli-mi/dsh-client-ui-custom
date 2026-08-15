/** Locale dictionaries for the plugin marketplace tab. */
/** Dictionary namespace owned by the marketplace surface. */
export declare const MARKETPLACE_NS = "marketplace";
/** All marketplace copy keys. */
export type MarketplaceKey = 'tab' | 'title' | 'intro' | 'refresh' | 'refreshing' | 'empty' | 'installed' | 'install' | 'copied' | 'source' | 'source.bundled' | 'source.remote' | 'openOnGitHub' | 'installHint' | 'error' | 'errorHint' | 'errorNetwork' | 'errorHttp' | 'errorInvalid' | 'total' | 'sort' | 'sort.stars' | 'sort.date' | 'limit';
/** Simplified Chinese copy. */
export declare const zh: Record<MarketplaceKey, string>;
/** English copy. */
export declare const en: Record<MarketplaceKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The plugin marketplace tab copy. */
        marketplace: MarketplaceKey;
    }
}
//# sourceMappingURL=marketplace-locales.d.ts.map