// @vitest-environment node
/**
 * ui-custom appearance controller: the staged draft over the ui-custom
 * settings scope. Regression coverage for the "form shows schema defaults and
 * a save overwrites the real config" bug: the draft must follow the scope's
 * resolved section until the user stages an edit.
 */
import { describe, expect, it } from 'vitest'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { AppearanceSettingsController } from '../src/client/appearance/controller.ts'
import { normalizeConfig } from '../src/client/config.ts'
import type { ThemeSection } from '../src/shared.ts'

const defaults = normalizeConfig(undefined, undefined)

/** Minimal fake scope: value + listeners; set/unset mutate and notify. */
function fakeScope(initial: SettingsScopeSnapshot<ThemeSection>): SettingsScope<ThemeSection> {
  let snap = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snap,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    set: async (field, value) => {
      snap = { ...snap, value: { ...(snap.value ?? {}), [field]: value } as ThemeSection }
      for (const listener of listeners) listener()
    },
    unset: async (field) => {
      const value = { ...(snap.value ?? {}) } as ThemeSection
      delete (value as unknown as Record<string, unknown>)[field]
      snap = { ...snap, value }
      for (const listener of listeners) listener()
    },
  }
}

const loaded = (value: Partial<ThemeSection>): SettingsScopeSnapshot<ThemeSection> => ({
  status: 'ready', value: value as ThemeSection, base: undefined, user: undefined, revision: 1, writable: true, mode: 'host',
})

describe('AppearanceSettingsController', () => {
  it('seeds the draft from an already-loaded scope section, not schema defaults', () => {
    const scope = fakeScope(loaded({ wallpaper: '/wallpaper.png', surfaceOpacity: 35, accent: '#4176e6' }))
    const controller = new AppearanceSettingsController(scope, defaults)
    const state = controller.store.getSnapshot()
    expect(state.values.wallpaper).toBe('/wallpaper.png')
    expect(state.draft.wallpaper).toBe('/wallpaper.png')
    expect(state.draft.surfaceOpacity).toBe(35)
    expect(state.draft.accent).toBe('#4176e6')
    expect(state.dirty).toBe(false)
  })

  it('adopts a late-arriving section into the draft before any user edit', () => {
    const scope = fakeScope({ status: 'loading', value: undefined, base: undefined, user: undefined, revision: undefined, writable: false, mode: 'host' })
    const controller = new AppearanceSettingsController(scope, defaults)
    const { dispose } = controller.mount()
    void scope.set('wallpaper', '/wallpaper.png')
    const state = controller.store.getSnapshot()
    expect(state.draft.wallpaper).toBe('/wallpaper.png')
    expect(state.dirty).toBe(false)
    dispose()
  })

  it('keeps a user-staged edit while the scope updates elsewhere', () => {
    const scope = fakeScope(loaded({ wallpaper: '/wallpaper.png', surfaceOpacity: 35 }))
    const controller = new AppearanceSettingsController(scope, defaults)
    const { dispose } = controller.mount()
    controller.setField('surfaceOpacity', 77)
    void scope.set('wallpaper', '/other.png')
    const state = controller.store.getSnapshot()
    // The staged edit survives the external update; the draft is preserved
    // wholesale until the user resolves it (save/reset).
    expect(state.draft.surfaceOpacity).toBe(77)
    expect(state.draft.wallpaper).toBe('/wallpaper.png')
    expect(state.dirty).toBe(true)
    dispose()
  })

  it('save writes only the edited fields and re-syncs the draft', async () => {
    const scope = fakeScope(loaded({ wallpaper: '/wallpaper.png', surfaceOpacity: 35 }))
    const controller = new AppearanceSettingsController(scope, defaults)
    controller.setField('surfaceOpacity', 77)
    await controller.save()
    expect(scope.getSnapshot().value?.surfaceOpacity).toBe(77)
    expect(scope.getSnapshot().value?.wallpaper).toBe('/wallpaper.png')
    const state = controller.store.getSnapshot()
    expect(state.draft.surfaceOpacity).toBe(77)
    expect(state.dirty).toBe(false)
  })

  it('resetAll unsets every field and the draft follows the composition layer', async () => {
    const scope = fakeScope(loaded({ wallpaper: '/wallpaper.png', surfaceOpacity: 35 }))
    const controller = new AppearanceSettingsController(scope, defaults)
    await controller.resetAll()
    expect(scope.getSnapshot().value).toEqual({})
    // Draft now reflects the scope (empty section → loader defaults), not stale edits.
    expect(controller.store.getSnapshot().draft.wallpaper).toBe(defaults.wallpaper)
  })
})
