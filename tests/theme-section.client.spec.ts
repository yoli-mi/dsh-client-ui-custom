// @vitest-environment node
/**
 * ui-custom theme-section mapping: settings section → effective config.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULTS, normalizeConfig } from '../src/client/config.ts'
import { configFromThemeSection } from '../src/client/theme-section.ts'

const normalized = normalizeConfig(undefined, undefined)

describe('configFromThemeSection', () => {
  it('returns the normalized config when the section is absent', () => {
    expect(configFromThemeSection(normalized, undefined)).toEqual(normalized)
  })

  it('overlays section fields over the loader defaults', () => {
    const config = configFromThemeSection(normalized, {
      wallpaper: '/wall.jpg',
      glass: 'mica',
      accent: '#ff7fb2',
      autoAccent: true,
      surfaceOpacity: 42,
      sidebarOpacity: 50,
      chatSurfaceOpacity: 60,
      inputOpacity: 70,
      codeBlockOpacity: 55,
      darkSurfaceOpacity: 40,
      gradient: 'linear-gradient(red, blue)',
      darkScrim: 30,
      fontFamily: 'MiSans',
      scrollbarAccent: true,
      vignette: true,
    })
    expect(config.wallpaper).toBe('/wall.jpg')
    expect(config.glass).toBe('mica')
    expect(config.accent).toBe('#ff7fb2')
    expect(config.autoAccent).toBe(true)
    expect(config.surfaceOpacity).toBe(42)
    expect(config.darkScrim).toBe(30)
    expect(config.fontFamily).toBe('MiSans')
    expect(config.vignette).toBe(true)
    // Untouched fields keep loader defaults.
    expect(config.preset).toBe(normalized.preset)
  })

  it('falls back per field when the section leaves it undefined', () => {
    const config = configFromThemeSection(normalized, {
      wallpaper: undefined,
      glass: undefined,
      accent: undefined,
      autoAccent: undefined,
      surfaceOpacity: undefined,
      sidebarOpacity: undefined,
      chatSurfaceOpacity: undefined,
      inputOpacity: undefined,
      codeBlockOpacity: undefined,
      darkSurfaceOpacity: undefined,
      gradient: undefined,
      darkScrim: undefined,
      fontFamily: undefined,
      scrollbarAccent: undefined,
      vignette: undefined,
    })
    expect(config).toEqual(normalized)
  })

  it('rejects an invalid glass level (falls back to the loader)', () => {
    const config = configFromThemeSection(normalized, {
      wallpaper: '/x.png', glass: 'banana' as string, accent: undefined,
      autoAccent: undefined, surfaceOpacity: undefined, sidebarOpacity: undefined,
      chatSurfaceOpacity: undefined, inputOpacity: undefined, codeBlockOpacity: undefined,
      darkSurfaceOpacity: undefined, gradient: undefined, darkScrim: undefined,
      fontFamily: undefined, scrollbarAccent: undefined, vignette: undefined,
    })
    expect(config.wallpaper).toBe('/x.png')
    expect(config.glass).toBe(normalized.glass)
  })

  it('never lands an explicit undefined on the optional darkSurfaceOpacity', () => {
    const config = configFromThemeSection(normalized, {
      wallpaper: '/x.png', glass: 'frosted', accent: undefined, autoAccent: undefined,
      surfaceOpacity: undefined, sidebarOpacity: undefined, chatSurfaceOpacity: undefined,
      inputOpacity: undefined, codeBlockOpacity: undefined, darkSurfaceOpacity: undefined,
      gradient: undefined, darkScrim: undefined, fontFamily: undefined,
      scrollbarAccent: undefined, vignette: undefined,
    })
    expect(typeof config.darkSurfaceOpacity).toBe('number')
  })

  it('treats empty string knobs as "no override" (falls back to the loader)', () => {
    // Clearing wallpaper/gradient/etc. in the settings form must revert to
    // the loader layer — never silently disable the theme with ''.
    const config = configFromThemeSection(normalized, {
      wallpaper: '', glass: 'frosted', accent: '', autoAccent: undefined,
      surfaceOpacity: undefined, sidebarOpacity: undefined, chatSurfaceOpacity: undefined,
      inputOpacity: undefined, codeBlockOpacity: undefined, darkSurfaceOpacity: undefined,
      gradient: '', darkScrim: undefined, fontFamily: '', scrollbarAccent: undefined,
      vignette: undefined,
    })
    expect(config.wallpaper).toBe(normalized.wallpaper)
    expect(config.accent).toBe(normalized.accent)
    expect(config.gradient).toBe(normalized.gradient)
    expect(config.fontFamily).toBe(normalized.fontFamily)
  })

  it('inherits the dark surface opacity from the live surfaceOpacity when unset', () => {
    // No explicit darkSurfaceOpacity in the section → the dark main surface
    // follows 表面不透明度 (index.ts drops the loader-base dark value unless
    // the raw user layer carries an explicit override).
    const config = configFromThemeSection(normalized, {
      wallpaper: '/x.png', glass: 'frosted', accent: '#123456', autoAccent: undefined,
      surfaceOpacity: 72, sidebarOpacity: undefined, chatSurfaceOpacity: undefined,
      inputOpacity: undefined, codeBlockOpacity: undefined, darkSurfaceOpacity: undefined,
      gradient: undefined, darkScrim: undefined, fontFamily: undefined,
      scrollbarAccent: undefined, vignette: undefined,
    })
    expect(config.darkSurfaceOpacity).toBe(72)
    // An explicit dark override still wins.
    const overridden = configFromThemeSection(normalized, {
      wallpaper: '/x.png', glass: 'frosted', accent: undefined, autoAccent: undefined,
      surfaceOpacity: 72, sidebarOpacity: undefined, chatSurfaceOpacity: undefined,
      inputOpacity: undefined, codeBlockOpacity: undefined, darkSurfaceOpacity: 41,
      gradient: undefined, darkScrim: undefined, fontFamily: undefined,
      scrollbarAccent: undefined, vignette: undefined,
    })
    expect(overridden.darkSurfaceOpacity).toBe(41)
  })

  it('respects DEFAULTS as the section seed', () => {
    // The plugin's shipped defaults are neutral; mapping an empty section
    // over DEFAULTS reproduces DEFAULTS exactly.
    expect(configFromThemeSection(DEFAULTS, undefined)).toEqual(DEFAULTS)
  })
})
