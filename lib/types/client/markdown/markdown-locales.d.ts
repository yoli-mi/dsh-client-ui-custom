/** Copy for the Markdown-rendering toggle in General settings. */
/** Dictionary namespace owned by the user-markdown surface. */
export declare const MARKDOWN_NS = "markdown";
/** All markdown toggle copy keys. */
export type MarkdownKey = 'renderTitle' | 'renderDesc';
/** Simplified Chinese copy. */
export declare const zh: Record<MarkdownKey, string>;
/** English copy. */
export declare const en: Record<MarkdownKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The user-markdown toggle copy. */
        markdown: MarkdownKey;
    }
}
//# sourceMappingURL=markdown-locales.d.ts.map