/** Copy for the history-strip pin ("悬挂") action. */

/** Dictionary namespace owned by the pin entry. */
export const PIN_NS = 'pin'

/** All pin copy keys. */
export type PinKey = 'pin' | 'pinActive' | 'pinHint'

/** Simplified Chinese copy. */
export const zh: Record<PinKey, string> = {
  pin: '悬挂该段对话',
  pinActive: '取消悬挂',
  pinHint: '悬挂后该段对话无视条数限制，始终显示在历史条中',
}

/** English copy. */
export const en: Record<PinKey, string> = {
  pin: 'Pin this segment',
  pinActive: 'Unpin',
  pinHint: 'Pinned segments always show in the history bar, ignoring the count limit',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The history-strip pin action copy. */
    pin: PinKey
  }
}
