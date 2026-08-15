/**
 * Per-message pin ("悬挂") control, rendered in the assistant message's
 * IconActions row (between copy and branch, via the
 * conversation.chat.assistant-actions slot). Pinning a turn makes its history
 * bar ignore the strip's count limit and marks it with the theme-accent
 * frame. Only renders while the history strip is enabled (historyPosition
 * ≠ 'off') — with the strip hidden there is nothing to pin to.
 */

import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (the assistant-actions
// entry + its owner props) and the locale seat.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { DEFAULT_HISTORY_POSITION } from '../../shared.ts'
import type { PinTurnInjected } from './contract.ts'
import css from './PinTurnAction.module.css'

/** A location-pin glyph (filled, matches the ic_ds_* icon chrome). */
function PinIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Full props of the per-message pin entry. */
export type PinTurnActionProps =
  PropsRuntime<'conversation.chat.assistant-actions'>
  & PropsLocale<'pin'>
  & InjectFace<PinTurnInjected>

/**
 * Render the pin toggle for one turn's assistant message.
 * @param props - owner turn/message identity + injected scope face + locale.
 */
export function PinTurnAction({ turn, sessionId, usePosition, usePinnedTurns, togglePin, t }: PinTurnActionProps) {
  const positionScope = usePosition(value => value)
  const position = positionScope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION
  const pinnedScope = usePinnedTurns(value => value)
  const pinned = (pinnedScope?.value?.pinnedTurns?.[sessionId] ?? []).includes(turn)
  // The pin addresses the history strip; with the strip hidden it is a no-op.
  if (position === 'off') return null
  const label = pinned ? t('pinActive') : t('pin')
  return (
    <Tooltip label={label} side="bottom">
      <button
        type="button"
        className={css.action}
        aria-label={label}
        aria-pressed={pinned}
        data-active={pinned || undefined}
        onClick={() => { togglePin(turn) }}
      >
        <PinIcon />
      </button>
    </Tooltip>
  )
}
