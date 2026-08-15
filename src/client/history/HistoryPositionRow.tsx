/**
 * General-settings row: where the floating history strip sits (left / right /
 * off). Reads/writes the ui-custom settings scope's `historyPosition`; the
 * strip's count selector (HistoryLimitRow) only appears while this is not
 * 'off'.
 */

import { useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  DEFAULT_HISTORY_POSITION, HISTORY_POSITIONS, type HistoryPosition, type UiCustomSection,
} from '../../shared.ts'
import type { HistoryKey } from './history-locales.ts'
import css from './HistoryPositionRow.module.css'

/** Registration-side preference face. */
export interface HistoryPositionRowInjected {
  hooks: {
    /** The ui-custom settings scope, read for historyPosition. */
    historyPosition: SettingsScope<UiCustomSection>
  }
  /** Change the strip's side ('left' / 'right') or hide it ('off'). */
  setHistoryPosition: (position: HistoryPosition) => void
}

/** Full Settings-row props. */
export type HistoryPositionRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'history'>
  & InjectFace<HistoryPositionRowInjected>

/** The selectable sides, in display order (the default is the middle one). */
const OPTIONS: readonly { id: HistoryPosition; label: HistoryKey }[] = [
  { id: 'left', label: 'positionLeft' },
  { id: 'right', label: 'positionRight' },
  { id: 'off', label: 'positionOff' },
]

/**
 * Render the history bar position selector.
 * @param props - composed Settings slot props.
 */
export function HistoryPositionRow({ useHistoryPosition, setHistoryPosition, t }: HistoryPositionRowProps) {
  const scope = useHistoryPosition(value => value)
  const [open, setOpen] = useState(false)
  const position = scope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION
  const translator = t as TranslateNS<'history'>
  const selectedLabel = (OPTIONS.find(option => option.id === position) ?? OPTIONS[1]!).label

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{translator('positionTitle')}</div>
        <div className={css.desc}>{translator('positionDesc')}</div>
      </div>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={OPTIONS.map(option => ({ id: option.id, label: translator(option.label) }))}
        selectedId={position}
        onSelect={(id) => {
          setOpen(false)
          // Guard the Menu's free-form id before it lands in the settings doc.
          if (HISTORY_POSITIONS.includes(id as HistoryPosition)) setHistoryPosition(id as HistoryPosition)
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
