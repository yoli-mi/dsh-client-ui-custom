// @vitest-environment jsdom
/**
 * ui-custom config pipeline: preset resolution, DEFAULTS ← preset ← explicit
 * merge order, field coercion/clamping, and the dark-surface alpha fallback.
 * Pure logic — no DOM mutation is exercised here (apply.ts owns that).
 */
import { describe, expect, it } from 'vitest'
import { DEFAULTS, normalizeConfig, resolveFeatures, resolveGlass, SHORTCUT_DEFAULTS } from '../src/client/config.ts'
import { PRESETS, PRESET_MAP, resolvePreset } from '../src/client/presets.ts'
import { FONT_PRESETS, FONT_PRESET_MAP, resolveFontPreset } from '../src/client/font-presets.ts'
import { randomInspirationConfig } from '../src/client/color.ts'
import { FEATURES } from '../src/shared.ts'

describe('presets', () => {
  it('registers the shipped presets with unique ids', () => {
    const ids = PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const preset of PRESETS) {
      expect(PRESET_MAP.get(preset.id)).toBe(preset)
      expect(preset.name.length).toBeGreaterThan(0)
    }
  })

  it('resolves known presets and rejects unknown/empty ids', () => {
    expect(resolvePreset('ink-teal')?.accent).toBe('#1e8f7e')
    expect(resolvePreset('apricot-gold')?.surfaceOpacity).toBe(42)
    expect(resolvePreset('nope')).toBeUndefined()
    expect(resolvePreset('')).toBeUndefined()
    expect(resolvePreset(undefined)).toBeUndefined()
  })

  it('ships only generic color-scheme presets (no personal looks)', () => {
    for (const id of ['ink-teal', 'ink-blue', 'dusty-rose', 'apricot-gold', 'mist-gray', 'ink-violet']) {
      expect(PRESET_MAP.has(id), `missing preset ${id}`).toBe(true)
    }
    // Personal presets must never ship with the plugin.
    for (const id of ['miku']) {
      expect(PRESET_MAP.has(id), `personal preset ${id} must not ship`).toBe(false)
    }
    // Presets are pure color-gradient themes: no shipped wallpapers, every one
    // carries its own gradient as the background identity.
    for (const preset of PRESETS) {
      expect(preset.config.glass).toBeDefined()
      expect(preset.config.wallpaper).toBe('')
      expect(preset.config.gradient).toBeTruthy()
    }
  })
})

describe('resolveGlass', () => {
  it('maps levels to blur + saturation', () => {
    expect(resolveGlass({ glass: 'off' })).toEqual({ blur: 0, saturate: 1 })
    expect(resolveGlass({ glass: 'light' })).toEqual({ blur: 6, saturate: 1.15 })
    expect(resolveGlass({ glass: 'frosted' })).toEqual({ blur: 14, saturate: 1.25 })
    expect(resolveGlass({ glass: 'mica' })).toEqual({ blur: 22, saturate: 1.1 })
  })

  it('lets an explicit wallpaperBlur win over the glass level', () => {
    expect(resolveGlass({ glass: 'mica', wallpaperBlur: 8 })).toEqual({ blur: 8, saturate: 1.1 })
    expect(resolveGlass({ glass: 'off', wallpaperBlur: 30 })).toEqual({ blur: 30, saturate: 1 })
  })

  it('clamps explicit blur and falls back on unknown levels', () => {
    expect(resolveGlass({ glass: 'banana' as never, wallpaperBlur: 99 })).toEqual({ blur: 60, saturate: 1.25 })
    expect(resolveGlass({ wallpaperBlur: -3 })).toEqual({ blur: 0, saturate: 1.25 })
  })
})

describe('normalizeConfig', () => {
  it('returns defaults when nothing is provided', () => {
    const config = normalizeConfig(undefined, undefined)
    // Normalized config carries every knob, including the derived
    // darkSurfaceOpacity (defaults to surfaceOpacity), so compare subset-wise.
    expect(config).toMatchObject(DEFAULTS)
    expect(config.darkSurfaceOpacity).toBe(DEFAULTS.surfaceOpacity)
  })

  it('merges preset under explicit config (explicit wins)', () => {
    const config = normalizeConfig(
      { accent: '#123456', surfaceOpacity: 71 },
      resolvePreset('apricot-gold'),
    )
    expect(config.accent).toBe('#123456')
    expect(config.surfaceOpacity).toBe(71)
    // Unset explicit fields come from the preset.
    expect(config.inputOpacity).toBe(72) // apricot-gold preset value
  })

  it('clamps percentages into 0–100 and falls back on garbage', () => {
    const config = normalizeConfig(
      { surfaceOpacity: 150, sidebarOpacity: -5, inputOpacity: 'oops' as unknown as number },
      undefined,
    )
    expect(config.surfaceOpacity).toBe(100)
    expect(config.sidebarOpacity).toBe(0)
    expect(config.inputOpacity).toBe(DEFAULTS.inputOpacity)
  })

  it('falls the dark surface opacity back to the surface opacity', () => {
    expect(normalizeConfig({ surfaceOpacity: 40 }, undefined).darkSurfaceOpacity).toBe(40)
    expect(normalizeConfig({ surfaceOpacity: 40, darkSurfaceOpacity: 25 }, undefined).darkSurfaceOpacity).toBe(25)
  })

  it('keeps gradient/customCss as strings and customVars as a string map', () => {
    const config = normalizeConfig(
      {
        gradient: '',
        customCss: 'body { color: red; }',
        customVars: { '--my-var': '12px', '--num': '4', bad: null as unknown as string },
      },
      undefined,
    )
    expect(config.gradient).toBe('')
    expect(config.customCss).toBe('body { color: red; }')
    expect(config.customVars['--my-var']).toBe('12px')
    expect(config.customVars['--num']).toBe('4')
    expect(config.customVars['bad']).toBeUndefined()
  })

  it('normalizes glass level and resolves the effective blur', () => {
    expect(normalizeConfig({ glass: 'mica' }, undefined).wallpaperBlur).toBe(22)
    expect(normalizeConfig({ glass: 'off' }, undefined).wallpaperBlur).toBe(0)
    // Explicit blur still wins inside normalization.
    expect(normalizeConfig({ glass: 'light', wallpaperBlur: 30 }, undefined).wallpaperBlur).toBe(30)
    // Unknown glass falls back to the default level.
    expect(normalizeConfig({ glass: 'banana' as never }, undefined).glass).toBe('frosted')
  })

  it('keeps autoAccent a boolean, defaulting to false', () => {
    expect(normalizeConfig(undefined, undefined).autoAccent).toBe(false)
    expect(normalizeConfig({ autoAccent: true }, undefined).autoAccent).toBe(true)
    expect(normalizeConfig({ autoAccent: 'yes' as unknown as boolean }, undefined).autoAccent).toBe(false)
  })

  it('normalizes the shortcuts config (trimmed strings, unknown dropped, missing → defaults)', () => {
    expect(normalizeConfig(undefined, undefined).shortcuts).toEqual(SHORTCUT_DEFAULTS)
    const config = normalizeConfig({
      shortcuts: {
        newConversation: ' Mod+Alt+N ',
        switchModel: 42 as unknown as string,
        cycleThinking: '',
        sendMessage: 'Enter',
        newline: 'Shift+Enter',
        usagePanel: 'Mod+Alt+U',
        defaultWorkspace: '',
        modelShortcuts: [],
      },
    }, undefined)
    expect(config.shortcuts).toEqual({
      newConversation: 'Mod+Alt+N', switchModel: '', cycleThinking: '',
      sendMessage: 'Enter', newline: 'Shift+Enter', usagePanel: 'Mod+Alt+U',
      defaultWorkspace: '', modelShortcuts: [],
    })
  })

  it('normalizes defaultWorkspace and the one-to-one model shortcuts', () => {
    const config = normalizeConfig({
      shortcuts: {
        newConversation: '',
        switchModel: '',
        cycleThinking: '',
        sendMessage: 'Enter',
        newline: 'Shift+Enter',
        usagePanel: 'Mod+Alt+U',
        defaultWorkspace: ' ws-1 ',
        modelShortcuts: [
          { combo: ' Mod+Alt+1 ', provider: 'deepseek-official', model: 'deepseek-v4-flash' },
          { combo: 'Mod+Alt+2', provider: '', model: 'x' },
          { combo: '', provider: 'p', model: 'm' },
          'garbage' as unknown as { combo: string; provider: string; model: string },
        ],
      },
    }, undefined)
    expect(config.shortcuts.defaultWorkspace).toBe('ws-1')
    expect(config.shortcuts.modelShortcuts).toEqual([
      { combo: 'Mod+Alt+1', provider: 'deepseek-official', model: 'deepseek-v4-flash' },
    ])
  })

  it('stays pure: normalization never mutates its inputs', () => {
    const raw = { surfaceOpacity: 80 }
    const preset = resolvePreset('apricot-gold')
    normalizeConfig(raw, preset)
    expect(raw.surfaceOpacity).toBe(80)
    expect(preset?.surfaceOpacity).toBe(42)
  })

  it('clamps and snaps the font scale to 0.9–1.1 in 0.05 steps', () => {
    expect(normalizeConfig(undefined, undefined).fontScale).toBe(1)
    expect(normalizeConfig({ fontScale: 0.94 }, undefined).fontScale).toBe(0.95)
    expect(normalizeConfig({ fontScale: 1.08 }, undefined).fontScale).toBe(1.1)
    expect(normalizeConfig({ fontScale: 1.2 }, undefined).fontScale).toBe(1.1)
    expect(normalizeConfig({ fontScale: 0.85 }, undefined).fontScale).toBe(0.9)
    expect(normalizeConfig({ fontScale: 'x' as unknown as number }, undefined).fontScale).toBe(1)
  })

  it('normalizes the code-font stack (trimmed, empty fallback)', () => {
    expect(normalizeConfig(undefined, undefined).codeFontFamily).toBe('')
    expect(normalizeConfig({ codeFontFamily: " 'Fira Code', monospace " }, undefined).codeFontFamily)
      .toBe("'Fira Code', monospace")
  })

  it('ships every opt-in feature default-off (a fresh install is the stock UI)', () => {
    // The usage-panel shortcut is the plugin's own binding — unbound by default.
    expect(SHORTCUT_DEFAULTS.usagePanel).toBe('')
    expect(normalizeConfig(undefined, undefined).shortcuts.usagePanel).toBe('')
  })
})

describe('font presets', () => {
  it('registers the shipped pairings with unique ids', () => {
    const ids = FONT_PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const preset of FONT_PRESETS) {
      expect(FONT_PRESET_MAP.get(preset.id)).toBe(preset)
      expect(preset.name.length).toBeGreaterThan(0)
    }
  })

  it('resolves pairings into ui + code stacks (default = keep stock)', () => {
    expect(resolveFontPreset('default')).toEqual({ fontFamily: '', codeFontFamily: '' })
    expect(resolveFontPreset('')).toEqual({ fontFamily: '', codeFontFamily: '' })
    expect(resolveFontPreset(undefined)).toEqual({ fontFamily: '', codeFontFamily: '' })
    expect(resolveFontPreset('nope')).toEqual({ fontFamily: '', codeFontFamily: '' })
    const lxgw = resolveFontPreset('lxgw')
    expect(lxgw.fontFamily).toContain('LXGW WenKai')
    expect(lxgw.codeFont).toBeUndefined() // resolved as codeFontFamily
    expect((lxgw as { codeFontFamily?: string }).codeFontFamily).toContain('Mono')
  })
})

describe('random inspiration', () => {
  /** Deterministic LCG for reproducible tests. */
  const seeded = (seed: number): () => number => {
    let s = seed >>> 0
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 4294967296
    }
  }

  it('generates a coherent, valid theme deterministically', () => {
    const first = randomInspirationConfig(seeded(42))
    const second = randomInspirationConfig(seeded(42))
    expect(second).toEqual(first) // same seed → same theme
    expect(first.accent).toMatch(/^#[0-9a-f]{6}$/i)
    expect(first.gradient).toContain('linear-gradient')
    expect(first.wallpaper).toBe('')
    expect(first.fontScale).toBe(1)
    expect(typeof first.surfaceOpacity).toBe('number')
    if (first.surfaceOpacity !== undefined) {
      expect(first.surfaceOpacity).toBeGreaterThanOrEqual(0)
      expect(first.surfaceOpacity).toBeLessThanOrEqual(100)
    }
    expect(['light', 'frosted', 'mica']).toContain(first.glass)
    expect(['md', 'lg']).toContain(first.cornerRadius)
  })

  it('yields different themes for different seeds', () => {
    const a = randomInspirationConfig(seeded(1))
    const b = randomInspirationConfig(seeded(999))
    expect(a.accent).not.toBe(b.accent)
  })
})

describe('resolveFeatures', () => {
  it('defaults to every feature when the config is absent or has no whitelist', () => {
    expect(resolveFeatures(undefined)).toEqual(new Set(FEATURES))
    expect(resolveFeatures({})).toEqual(new Set(FEATURES))
    expect(resolveFeatures({ features: [] })).toEqual(new Set(FEATURES))
  })

  it('whitelists only the listed features', () => {
    expect(resolveFeatures({ features: ['history', 'usage'] })).toEqual(new Set(['history', 'usage']))
    expect(resolveFeatures({ features: ['shortcuts'] })).toEqual(new Set(['shortcuts']))
  })

  it('drops unknown ids and de-duplicates', () => {
    expect(resolveFeatures({ features: ['shortcuts', 'nope' as never, 'history', 'history'] }))
      .toEqual(new Set(['shortcuts', 'history']))
    expect(resolveFeatures({ features: ['bogus' as never] }).size).toBe(0)
  })
})
