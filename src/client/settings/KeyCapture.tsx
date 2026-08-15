/**
 * KeyCapture: a recorder button — click, press the combination, done. Uses
 * the same pure parser as the shortcut listener, so a recorded spec always
 * round-trips. Esc cancels; modifier-only presses are ignored.
 */
import { useEffect, useRef, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { specFromEvent } from '../shortcuts.ts'
import css from './ShortcutsSection.module.css'/** Props for one recorder row. */
export interface KeyCaptureProps {
  /** The current combo spec ('' = unbound). */
  value: string
  /** Called with a freshly recorded combo spec. */
  onChange: (spec: string) => void
  /** Section translator. */
  t: TranslateNS<'shortcuts'>
  /** Whether the document accepts writes. */
  disabled?: boolean
  /** Optional id for label association. */
  id?: string
}

/**
 * Render the recorder button.
 * @param props - recorder props.
 * @returns the button element.
 */
export function KeyCapture({ value, onChange, t, disabled, id }: KeyCaptureProps) {
  const [recording, setRecording] = useState(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!recording) return
    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        setRecording(false)
        return
      }
      const spec = specFromEvent(event)
      if (spec !== null) {
        onChangeRef.current(spec)
        setRecording(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recording])

  return (
    <button
      type="button"
      id={id}
      className={recording ? `${css.capture} ${css.captureRecording}` : css.capture}
      disabled={disabled}
      aria-label={t('record')}
      onClick={() => setRecording(true)}
    >
      {recording ? t('comboHint') : (value === '' ? t('comboHint') : value)}
    </button>
  )
}
