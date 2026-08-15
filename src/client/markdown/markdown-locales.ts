/** Copy for the Markdown-rendering toggle in General settings. */

/** Dictionary namespace owned by the user-markdown surface. */
export const MARKDOWN_NS = 'markdown'

/** All markdown toggle copy keys. */
export type MarkdownKey = 'renderTitle' | 'renderDesc'

/** Simplified Chinese copy. */
export const zh: Record<MarkdownKey, string> = {
  renderTitle: 'Markdown 渲染',
  renderDesc: '你发送的消息以 Markdown 格式渲染（标题、列表、代码块等）；关闭后按纯文本显示。',
}

/** English copy. */
export const en: Record<MarkdownKey, string> = {
  renderTitle: 'Markdown rendering',
  renderDesc: 'Render the messages you send as Markdown (headings, lists, code blocks); off = plain text.',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The user-markdown toggle copy. */
    markdown: MarkdownKey
  }
}
