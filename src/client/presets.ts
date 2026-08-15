/**
 * Theme preset registry: named, reusable partial configs.
 *
 * This is the plugin's main extension surface — adding a new "art choice" is
 * one entry here: pick an id/name/description and a partial config. Users
 * select it from the appearance page (one-click preview) or with
 * `preset: '<id>'` in their profile row; any explicit config field still
 * overrides the preset (DEFAULTS ← preset ← explicit config).
 *
 * Each preset is a complete art direction: a pure color-gradient wash (the
 * theme base when no wallpaper is set), accent, gradient/scrim, the glass +
 * opacity recipe, and the refinement knobs (cornerRadius / surfaceShadow /
 * focusGlow / wallpaperTone / darkAccent). Presets do not ship wallpapers —
 * the gradient *is* the theme; a user's own `wallpaper` config still wins
 * and layers under it.
 *
 * The six schemes use muted, low-saturation "高级" tones and are named after
 * their dominant color with a minimal two-character name.
 */
import type { CustomThemeConfig } from './config.ts'

/** One named preset. */
export interface ThemePreset {
  /** Stable id used in config (`preset: '<id>'`). */
  id: string
  /** Short display name. */
  name: string
  /** One-line description (README + settings gallery). */
  description: string
  /** Partial config overlaid on DEFAULTS. */
  config: Partial<CustomThemeConfig>
}

/** 黛青 — ink-teal jade, quiet and deep. */
const INK_TEAL: ThemePreset = {
  id: 'ink-teal',
  name: '黛青',
  description: '青玉色渐变，静谧沉稳。',
  config: {
    wallpaper: '',
    glass: 'light',
    accent: '#1e8f7e',
    autoAccent: false,
    surfaceOpacity: 40,
    sidebarOpacity: 40,
    chatSurfaceOpacity: 64,
    inputOpacity: 70,
    codeBlockOpacity: 50,
    darkSurfaceOpacity: 40,
    gradient: 'linear-gradient(160deg, rgb(30 143 126 / 0.42) 0%, rgb(103 197 178 / 0.26) 55%, rgb(243 250 247 / 0.34) 100%)',
    darkScrim: 18,
    fontFamily: '',
    scrollbarAccent: true,
    vignette: false,
    cornerRadius: 'lg',
    surfaceShadow: 'soft',
    focusGlow: 'on',
    wallpaperTone: 'inherit',
    darkAccent: '',
  },
}

/** 黛蓝 — deep ink blue, restrained. */
const INK_BLUE: ThemePreset = {
  id: 'ink-blue',
  name: '黛蓝',
  description: '黛蓝渐变，深邃克制的蓝。',
  config: {
    wallpaper: '',
    glass: 'light',
    accent: '#3f63d8',
    autoAccent: false,
    surfaceOpacity: 38,
    sidebarOpacity: 38,
    chatSurfaceOpacity: 62,
    inputOpacity: 68,
    codeBlockOpacity: 48,
    darkSurfaceOpacity: 38,
    gradient: 'linear-gradient(160deg, rgb(63 99 216 / 0.40) 0%, rgb(129 158 233 / 0.24) 55%, rgb(246 248 253 / 0.34) 100%)',
    darkScrim: 18,
    fontFamily: '',
    scrollbarAccent: true,
    vignette: false,
    cornerRadius: 'md',
    surfaceShadow: 'soft',
    focusGlow: 'on',
    wallpaperTone: 'inherit',
    darkAccent: '',
  },
}

/** 藕荷 — dusty lotus rose, warm and gentle. */
const DUSTY_ROSE: ThemePreset = {
  id: 'dusty-rose',
  name: '藕荷',
  description: '藕荷色渐变，温润柔和的粉。',
  config: {
    wallpaper: '',
    glass: 'light',
    accent: '#c2788f',
    autoAccent: false,
    surfaceOpacity: 42,
    sidebarOpacity: 42,
    chatSurfaceOpacity: 66,
    inputOpacity: 70,
    codeBlockOpacity: 52,
    darkSurfaceOpacity: 42,
    gradient: 'linear-gradient(160deg, rgb(194 120 143 / 0.36) 0%, rgb(224 168 186 / 0.22) 55%, rgb(252 246 248 / 0.32) 100%)',
    darkScrim: 16,
    fontFamily: '',
    scrollbarAccent: true,
    vignette: false,
    cornerRadius: 'md',
    surfaceShadow: 'soft',
    focusGlow: 'inherit',
    wallpaperTone: 'inherit',
    darkAccent: '',
  },
}

/** 杏金 — apricot gold, understated warmth. */
const APRICOT_GOLD: ThemePreset = {
  id: 'apricot-gold',
  name: '杏金',
  description: '杏金色渐变，温雅低调的金。',
  config: {
    wallpaper: '',
    glass: 'light',
    accent: '#c0863c',
    autoAccent: false,
    surfaceOpacity: 42,
    sidebarOpacity: 42,
    chatSurfaceOpacity: 66,
    inputOpacity: 72,
    codeBlockOpacity: 52,
    darkSurfaceOpacity: 42,
    gradient: 'linear-gradient(160deg, rgb(192 134 60 / 0.36) 0%, rgb(224 184 122 / 0.22) 55%, rgb(250 246 238 / 0.32) 100%)',
    darkScrim: 16,
    fontFamily: '',
    scrollbarAccent: true,
    vignette: false,
    cornerRadius: 'md',
    surfaceShadow: 'soft',
    focusGlow: 'inherit',
    wallpaperTone: 'inherit',
    darkAccent: '',
  },
}

/** 雾灰 — cool slate mist, calm and quiet. */
const MIST_GRAY: ThemePreset = {
  id: 'mist-gray',
  name: '雾灰',
  description: '雾灰色渐变，清冷安静的灰蓝。',
  config: {
    wallpaper: '',
    glass: 'frosted',
    accent: '#64728e',
    autoAccent: false,
    surfaceOpacity: 30,
    sidebarOpacity: 30,
    chatSurfaceOpacity: 52,
    inputOpacity: 60,
    codeBlockOpacity: 40,
    darkSurfaceOpacity: 30,
    gradient: 'linear-gradient(160deg, rgb(100 114 142 / 0.34) 0%, rgb(44 52 72 / 0.38) 55%, rgb(16 19 27 / 0.48) 100%)',
    darkScrim: 26,
    fontFamily: '',
    scrollbarAccent: false,
    vignette: true,
    cornerRadius: 'md',
    surfaceShadow: 'medium',
    focusGlow: 'inherit',
    wallpaperTone: 'inherit',
    darkAccent: '',
  },
}

/** 墨紫 — ink violet, quiet mystery for dark mode. */
const INK_VIOLET: ThemePreset = {
  id: 'ink-violet',
  name: '墨紫',
  description: '墨紫色渐变，沉静神秘。',
  config: {
    wallpaper: '',
    glass: 'frosted',
    accent: '#8268c4',
    autoAccent: false,
    surfaceOpacity: 28,
    sidebarOpacity: 28,
    chatSurfaceOpacity: 50,
    inputOpacity: 60,
    codeBlockOpacity: 40,
    darkSurfaceOpacity: 28,
    gradient: 'linear-gradient(160deg, rgb(130 104 196 / 0.36) 0%, rgb(76 62 122 / 0.42) 55%, rgb(22 18 38 / 0.52) 100%)',
    darkScrim: 30,
    fontFamily: '',
    scrollbarAccent: true,
    vignette: true,
    cornerRadius: 'lg',
    surfaceShadow: 'medium',
    focusGlow: 'on',
    wallpaperTone: 'inherit',
    darkAccent: '#8268c4',
  },
}

/** All shipped presets, in display order. */
export const PRESETS: readonly ThemePreset[] = [
  INK_TEAL, INK_BLUE, DUSTY_ROSE, APRICOT_GOLD, MIST_GRAY, INK_VIOLET,
]

/** Id → preset lookup. */
export const PRESET_MAP: ReadonlyMap<string, ThemePreset> = new Map(PRESETS.map((preset) => [preset.id, preset]))

/**
 * Resolve a preset id to its partial config.
 * @param id - preset id ('' or unknown ids resolve to undefined).
 * @returns the preset's partial config, or undefined.
 */
export function resolvePreset(id: string | undefined): Partial<CustomThemeConfig> | undefined {
  if (id === undefined || id === '') return undefined
  return PRESET_MAP.get(id)?.config
}
