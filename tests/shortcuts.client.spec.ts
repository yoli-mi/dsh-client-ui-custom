// @vitest-environment node
/**
 * ui-custom key-combo parsing and matching (shortcuts.ts): the pure half of
 * the shortcut feature. DOM wiring (the keydown listener) is not exercised
 * here — parsing/matching contracts are.
 */
import { describe, expect, it } from 'vitest'
import {
  buildShortcutMap, composerRemapDecision, keyToToken, matchesKeyCombo, parseKeyCombo, specFromEvent,
} from '../src/client/shortcuts.ts'

const event = (over: Partial<Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>> = {}) => ({
  key: over.key ?? 'n',
  ctrlKey: over.ctrlKey ?? false,
  metaKey: over.metaKey ?? false,
  altKey: over.altKey ?? false,
  shiftKey: over.shiftKey ?? false,
})

describe('parseKeyCombo', () => {
  it('parses modifier + key specs case-insensitively', () => {
    expect(parseKeyCombo('Mod+Shift+N')).toEqual({ mod: true, alt: false, shift: true, key: 'n' })
    expect(parseKeyCombo('alt+m')).toEqual({ mod: false, alt: true, shift: false, key: 'm' })
    expect(parseKeyCombo('Ctrl+Alt+Shift+F5')).toEqual({ mod: true, alt: true, shift: true, key: 'F5' })
  })

  it('accepts named keys and digits', () => {
    expect(parseKeyCombo('Mod+space')).toEqual({ mod: true, alt: false, shift: false, key: ' ' })
    expect(parseKeyCombo('Mod+Enter')).toEqual({ mod: true, alt: false, shift: false, key: 'Enter' })
    expect(parseKeyCombo('arrowup')).toEqual({ mod: false, alt: false, shift: false, key: 'ArrowUp' })
    expect(parseKeyCombo('Mod+7')).toEqual({ mod: true, alt: false, shift: false, key: '7' })
  })

  it('rejects empty, modifier-only, multi-key, and unknown specs', () => {
    expect(parseKeyCombo('')).toBeNull()
    expect(parseKeyCombo(undefined)).toBeNull()
    expect(parseKeyCombo('Mod+Alt')).toBeNull()
    expect(parseKeyCombo('N+M')).toBeNull()
    expect(parseKeyCombo('Mod+wat')).toBeNull()
    // Leading/trailing '+' are tolerated (empty tokens are dropped).
    expect(parseKeyCombo('+Mod+N')).toEqual({ mod: true, alt: false, shift: false, key: 'n' })
  })
})

describe('matchesKeyCombo', () => {
  it('requires the exact modifiers (unspecified ones must be released)', () => {
    const combo = parseKeyCombo('Mod+Shift+N')
    expect(combo).not.toBeNull()
    expect(matchesKeyCombo(combo!, event({ key: 'n', ctrlKey: true, shiftKey: true }))).toBe(true)
    expect(matchesKeyCombo(combo!, event({ key: 'n', metaKey: true, shiftKey: true }))).toBe(true)
    expect(matchesKeyCombo(combo!, event({ key: 'n', ctrlKey: true }))).toBe(false) // missing shift
    expect(matchesKeyCombo(combo!, event({ key: 'n', shiftKey: true }))).toBe(false) // missing mod
    expect(matchesKeyCombo(combo!, event({ key: 'n', ctrlKey: true, altKey: true, shiftKey: true }))).toBe(false) // extra alt
  })

  it('matches the exact key', () => {
    const combo = parseKeyCombo('Alt+M')
    expect(combo).not.toBeNull()
    expect(matchesKeyCombo(combo!, event({ key: 'm', altKey: true }))).toBe(true)
    expect(matchesKeyCombo(combo!, event({ key: 'M', altKey: true }))).toBe(false) // Shift state differs (event.key 'M' implies shift)
    expect(matchesKeyCombo(combo!, event({ key: 'n', altKey: true }))).toBe(false)
  })
})

describe('buildShortcutMap', () => {
  it('maps enabled specs to combos and disabled ones to null', () => {
    const map = buildShortcutMap({
      newConversation: 'Mod+Alt+N',
      switchModel: '',
      cycleThinking: 'bogus spec',
      sendMessage: 'Enter',
      newline: 'Shift+Enter',
      usagePanel: 'Mod+Alt+U',
    })
    expect(map.newConversation).toEqual({ mod: true, alt: true, shift: false, key: 'n' })
    expect(map.switchModel).toBeNull()
    expect(map.cycleThinking).toBeNull()
  })
})

describe('keyToToken / specFromEvent (settings recorder)', () => {
  it('maps event keys to combo tokens and rejects modifier-only presses', () => {
    expect(keyToToken('n')).toBe('n')
    expect(keyToToken(' ')).toBe('space')
    expect(keyToToken('ArrowUp')).toBe('up') // alias; 'arrowup' also parses
    expect(parseKeyCombo('arrowup')).not.toBeNull()
    expect(keyToToken('F5')).toBe('f5')
    expect(keyToToken('Control')).toBeNull()
    expect(keyToToken('Shift')).toBeNull()
    expect(keyToToken('Meta')).toBeNull()
  })

  it('builds a combo spec from a keydown event', () => {
    expect(specFromEvent({ key: 'n', ctrlKey: true, metaKey: false, altKey: true, shiftKey: false })).toBe('Mod+Alt+n')
    expect(specFromEvent({ key: 'Enter', ctrlKey: false, metaKey: false, altKey: false, shiftKey: true })).toBe('Shift+enter')
    expect(specFromEvent({ key: 'm', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false })).toBe('m')
    // Modifier-only presses record nothing (waits for the real key).
    expect(specFromEvent({ key: 'Alt', ctrlKey: false, metaKey: false, altKey: true, shiftKey: false })).toBeNull()
  })

  it('round-trips a recorded spec through the parser', () => {
    const spec = specFromEvent({ key: 't', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })!
    expect(parseKeyCombo(spec)).toEqual({ mod: true, alt: false, shift: false, key: 't' })
  })
})

describe('composerRemapDecision', () => {
  const enter = (over: Partial<Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'isComposing'>> = {}) => ({
    key: 'Enter', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, isComposing: false, ...over,
  })

  it('leaves the native defaults untouched', () => {
    const send = parseKeyCombo('Enter')
    const newline = parseKeyCombo('Shift+Enter')
    expect(composerRemapDecision(send, newline, enter())).toBeNull() // plain Enter sends natively
    expect(composerRemapDecision(send, newline, enter({ shiftKey: true }))).toBeNull() // Shift+Enter newlines natively
  })

  it('remaps a custom send combo to native send', () => {
    const send = parseKeyCombo('Mod+Enter')
    const newline = parseKeyCombo('Shift+Enter')
    expect(composerRemapDecision(send, newline, enter({ ctrlKey: true }))).toBe('send')
    expect(composerRemapDecision(send, newline, enter())).toBe('suppress') // plain Enter no longer sends
  })

  it('remaps a custom newline combo (Enter-as-newline workflow)', () => {
    const send = parseKeyCombo('Mod+Enter')
    const newline = parseKeyCombo('Enter')
    expect(composerRemapDecision(send, newline, enter())).toBe('newline') // plain Enter inserts a newline
    expect(composerRemapDecision(send, newline, enter({ ctrlKey: true }))).toBe('send') // Mod+Enter sends
    expect(composerRemapDecision(send, newline, enter({ shiftKey: true }))).toBe('suppress') // Shift+Enter rebound away
  })

  it('suppresses a native gesture whose default was rebound', () => {
    const send = parseKeyCombo('Enter')
    const newline = parseKeyCombo('Mod+Enter')
    expect(composerRemapDecision(send, newline, enter({ ctrlKey: true }))).toBe('newline')
    expect(composerRemapDecision(send, newline, enter({ shiftKey: true }))).toBe('suppress') // Shift+Enter unbound
  })

  it('never remaps during IME composition or non-Enter keys', () => {
    const send = parseKeyCombo('Mod+Enter')
    const newline = parseKeyCombo('Enter')
    expect(composerRemapDecision(send, newline, enter({ isComposing: true }))).toBeNull()
    expect(composerRemapDecision(send, newline, { ...enter(), key: 'Tab' })).toBeNull()
  })

  it('treats null bindings as native defaults', () => {
    expect(composerRemapDecision(null, null, enter())).toBeNull()
    expect(composerRemapDecision(null, null, enter({ shiftKey: true }))).toBeNull()
    expect(composerRemapDecision(null, null, enter({ ctrlKey: true }))).toBeNull() // Mod+Enter also native send
  })
})
