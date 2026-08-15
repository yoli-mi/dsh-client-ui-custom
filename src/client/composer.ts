/**
 * Composer input remapper: lets users rebind the send / newline gestures.
 *
 * Native composer behavior (ui-conversation InputBar): plain Enter submits,
 * Shift+Enter inserts a newline. When a user rebinds either gesture, this
 * capture-phase listener on `window` intercepts the Enter keydown BEFORE the
 * textarea's own handler and either:
 *   - re-dispatches a plain Enter on the textarea (send — the composer's own
 *     JS handler runs and submits, so untrusted-event default-action limits
 *     don't matter), or
 *   - inserts the newline manually via `setRangeText` + an `input` event
 *     (React's onChange picks it up and the draft updates).
 * Suppressed gestures (native forms whose default was rebound away) are
 * simply consumed. IME compositions are never touched.
 */
import type { ShortcutConfig } from './config.ts'
import { composerRemapDecision, parseKeyCombo } from './shortcuts.ts'

/** Marker placed on remapped events so the listener ignores its own echoes. */
const REMAPPED = '__dsuRemapped'

function insertNewline(target: HTMLTextAreaElement): void {
  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? start
  target.setRangeText('\n', start, end, 'end')
  target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak', data: '\n' }))
}

function dispatchNativeSend(target: HTMLTextAreaElement): void {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true,
  })
  ;(event as unknown as Record<string, unknown>)[REMAPPED] = true
  target.dispatchEvent(event)
}

/**
 * Install the composer remapper for one shortcuts config. Re-installable:
 * returns the disposer.
 * @param shortcuts - normalized shortcut config.
 * @returns the disposer removing the listener.
 */
export function installComposerInput(shortcuts: ShortcutConfig): () => void {
  const sendCombo = parseKeyCombo(shortcuts.sendMessage)
  const newlineCombo = parseKeyCombo(shortcuts.newline)
  if (sendCombo === null && newlineCombo === null) return () => {}

  const handler = (event: KeyboardEvent): void => {
    if ((event as unknown as Record<string, unknown>)[REMAPPED] === true) return
    const target = event.target
    if (!(target instanceof HTMLTextAreaElement)) return
    // IME composition guard: never steal Enter while composing (Chinese/JP IME).
    if (event.isComposing || event.keyCode === 229) return
    const decision = composerRemapDecision(sendCombo, newlineCombo, event)
    if (decision === null) return
    event.preventDefault()
    event.stopPropagation()
    if (decision === 'send') dispatchNativeSend(target)
    else if (decision === 'newline') insertNewline(target)
    // 'suppress' consumes the gesture; nothing else to do.
  }
  window.addEventListener('keydown', handler, true)
  return () => window.removeEventListener('keydown', handler, true)
}
