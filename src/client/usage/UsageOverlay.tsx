/** The shell.overlay entry: the usage panel popped by the shortcut (Mod+Alt+U). */

import { useEffect } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { usageOverlay } from '../usage-overlay.ts'
import type { UsageOverlayInjected } from './contract.ts'
import { UsagePanel } from './UsagePanel.tsx'
import css from './UsageOverlay.module.css'

/** Props the renderer binds for the overlay entry. */
export type UsageOverlayProps =
  PropsRuntime<'shell.overlay'>
  & PropsLocale<'usage'>
  & InjectFace<UsageOverlayInjected>

/**
 * Render the usage overlay (null while hidden; Esc / backdrop / close hides it).
 * @param props - composed slot props + injected hooks.
 * @returns the overlay element tree, or null.
 */
export function UsageOverlay({ t, useSessions, useUsageVisible }: UsageOverlayProps) {
  const visible = useUsageVisible((value) => value)
  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') usageOverlay.close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible])
  if (!visible) return null
  const translator = t as TranslateNS<'usage'>
  return (
    <div className={css.backdrop} role="presentation" onClick={() => usageOverlay.close()}>
      <div className={css.panel} role="dialog" aria-label={translator('title')} onClick={(event) => event.stopPropagation()}>
        <header className={css.header}>
          <h2 className={css.title}>{translator('title')}</h2>
          <button type="button" className={css.close} aria-label={translator('close')} onClick={() => usageOverlay.close()}>
            ×
          </button>
        </header>
        <div className={css.body}>
          <UsagePanel useSessions={useSessions} t={translator} />
        </div>
      </div>
    </div>
  )
}
