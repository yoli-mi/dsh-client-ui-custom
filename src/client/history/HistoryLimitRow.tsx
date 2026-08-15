/**
 * General-settings row: how many recent turns the history strip shows.
 * Reads/writes the ui-custom settings scope's `historyLimit` (0 = all).
 */

import { useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import { DEFAULT_HISTORY_LIMIT, DEFAULT_HISTORY_POSITION, type UiCustomSection } from '../../shared.ts'
import type { HistoryKey } from './history-locales.ts'
import css from './HistoryLimitRow.module.css'

/** Registration-side preference face. */
export interface HistoryLimitRowInjected {
  hooks: {
    /** The ui-custom settings scope, read for historyLimit. */
    historyLimit: SettingsScope<UiCustomSection>
  }
  /** Change the strip's recent-turns limit (0 = all). */
  setHistoryLimit: (limit: number) => void
}

/** Full Settings-row props. */
export type HistoryLimitRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'history'>
  & InjectFace<HistoryLimitRowInjected>

/** The selectable limits: 0 is the "all" sentinel. */
const OPTIONS: readonly { id: number; label: HistoryKey }[] = [
  { id: 5, label: 'limit5' },
  { id: 10, label: 'limit10' },
  { id: 20, label: 'limit20' },
  { id: 0, label: 'limitAll' },
]

/**
 * Render the history bar count selector. Hidden entirely while the strip is
 * turned off (historyPosition = 'off'); the hooks above stay ordered before
 * the conditional return.
 * @param props - composed Settings slot props.
 */
export function HistoryLimitRow({ useHistoryLimit, setHistoryLimit, t }: HistoryLimitRowProps) {
  const scope = useHistoryLimit(value => value)
  const [open, setOpen] = useState(false)
  // The count selector only applies while the strip is visible.
  const position = scope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION
  if (position === 'off') return null
  const limit = scope?.value?.historyLimit ?? DEFAULT_HISTORY_LIMIT
  const translator = t as TranslateNS<'history'>
  const selectedLabel = (OPTIONS.find(option => option.id === limit) ?? OPTIONS[OPTIONS.length - 1]!).label

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{translator('limitTitle')}</div>
        <div className={css.desc}>{translator('limitDesc')}</div>
      </div>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={OPTIONS.map(option => ({ id: String(option.id), label: translator(option.label) }))}
        selectedId={String(limit)}
        onSelect={(id) => {
          setOpen(false)
          setHistoryLimit(Number(id))
        }}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className={css.selector}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => { setOpen(value => !value) }}
          >
            {translator(selectedLabel)}
            <IconChevronDownOutline14 className={css.chevron} />
          </button>
        )}
      />
    </div>
  )
}
