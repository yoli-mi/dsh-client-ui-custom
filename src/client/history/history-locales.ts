/** Copy for the conversation-history strip, its toggle, and the General-settings row. */

/** Dictionary namespace owned by the history surface. */
export const HISTORY_NS = 'history'

/** All history copy keys, including relative-time templates ({n}/{m}/{d} placeholders). */
export type HistoryKey =
  | 'title' | 'open' | 'close' | 'noText' | 'jumpSegment'
  | 'positionTitle' | 'positionDesc' | 'positionLeft' | 'positionRight' | 'positionOff'
  | 'limitTitle' | 'limitDesc' | 'limit5' | 'limit10' | 'limit20' | 'limitAll'
  | 'justNow' | 'minutes' | 'hours' | 'days' | 'date'

/** Locale-aware relative-time templates fed to formatRelativeTime. */
export interface RelativeTimeCopy {
  justNow: string
  minutes: string
  hours: string
  days: string
  date: string
}

/** Simplified Chinese copy. */
export const zh: Record<HistoryKey, string> = {
  title: '历史记录',
  open: '历史',
  close: '关闭',
  noText: '（无文本）',
  jumpSegment: '跳转到该段对话',
  positionTitle: '历史条位置',
  positionDesc: '选择侧边历史条的位置；选择「关闭」后不显示历史条。',
  positionLeft: '左侧',
  positionRight: '右侧',
  positionOff: '关闭',
  limitTitle: '历史记录条数',
  limitDesc: '侧边历史条显示最近多少条记录；「全部」显示完整历史。',
  limit5: '最近 5 条',
  limit10: '最近 10 条',
  limit20: '最近 20 条',
  limitAll: '全部',
  justNow: '刚刚',
  minutes: '{n} 分钟前',
  hours: '{n} 小时前',
  days: '{n} 天前',
  date: '{m}月{d}日',
}

/** English copy. */
export const en: Record<HistoryKey, string> = {
  title: 'History',
  open: 'History',
  close: 'Close',
  noText: '(no text)',
  jumpSegment: 'Jump to this conversation segment',
  positionTitle: 'History bar position',
  positionDesc: 'Choose where the side history bar sits; "Off" hides it.',
  positionLeft: 'Left',
  positionRight: 'Right',
  positionOff: 'Off',
  limitTitle: 'History bar count',
  limitDesc: 'How many recent records the side history bar shows; "All" shows the full history.',
  limit5: 'Last 5',
  limit10: 'Last 10',
  limit20: 'Last 20',
  limitAll: 'All',
  justNow: 'just now',
  minutes: '{n}m ago',
  hours: '{n}h ago',
  days: '{n}d ago',
  date: '{m}/{d}',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The conversation-history surface copy. */
    history: HistoryKey
  }
}
