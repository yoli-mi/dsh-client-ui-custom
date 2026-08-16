/**
 * Theme config model + normalization pipeline for the ui-custom plugin.
 *
 * The pipeline is: `DEFAULTS` ← preset (presets.ts) ← profile `config`
 * (explicit user values always win), then every field is coerced and clamped
 * into a `CustomThemeConfig` the applier can trust. Keeping normalization
 * here (pure, DOM-free) makes it unit-testable and gives GitHub users a
 * single documented contract for what each knob accepts.
 */
import { SHORTCUT_ACTIONS } from './shortcuts.ts'
import type { ModelShortcut, PluginFeature } from '../shared.ts'
import { FEATURES } from '../shared.ts'

/** One user-customizable keybinding (key-combo spec; '' = default behavior). */
export interface ShortcutConfig {
  /** Start a new conversation. */
  newConversation: string
  /** Cycle to the next model in the session's catalog. */
  switchModel: string
  /** Cycle the model's reasoning effort (off → high → max → …). */
  cycleThinking: string
  /** Composer send gesture (native default: Enter). */
  sendMessage: string
  /** Composer newline gesture (native default: Shift+Enter). */
  newline: string
  /** Toggle the app-usage panel (default: Mod+Alt+U). */
  usagePanel: string
  /** Workspace the new-conversation shortcut opens in ('' = current/recent). */
  defaultWorkspace: string
  /** One-to-one model shortcuts: each combo jumps to its specific model. */
  modelShortcuts: ModelShortcut[]
}


/**
 * Shipped shortcut defaults. The composer gestures default to their native
 * forms (Enter sends, Shift+Enter newlines), so an unconfigured profile is
 * byte-for-byte identical to the stock composer; the plugin-only usage-panel
 * binding ships OFF so a fresh install changes nothing until the user opts in.
 */
export { SHORTCUT_ACTIONS } from './shortcuts.ts'

export const SHORTCUT_DEFAULTS: ShortcutConfig = {
  newConversation: '',
  switchModel: '',
  cycleThinking: '',
  sendMessage: 'Enter',
  newline: 'Shift+Enter',
  usagePanel: '',
  defaultWorkspace: '',
  modelShortcuts: [],
}

/** Every knob the plugin understands. New art options extend this interface. */
export interface CustomThemeConfig {
  /** Preset id from presets.ts ('' = none; preset fields merge under explicit config). */
  preset: string
  /** Wallpaper URL or web-served path (empty string = plugin off). */
  wallpaper: string
  /** Frosted-glass blur radius on the app root, px (0 disables). Resolved from `glass` unless explicitly set. */
  wallpaperBlur: number
  /** Glass level: high-level frosted-glass choice driving blur + saturation. */
  glass: GlassLevel
  /** Accent color; the whole deepseek ramp is derived from it. */
  accent: string
  /** Derive the accent color automatically from the wallpaper (overrides `accent` on success). */
  autoAccent: boolean
  /** Main surface opacity, 0–100 (chat/details columns). */
  surfaceOpacity: number
  /** Sidebar surface opacity, 0–100. */
  sidebarOpacity: number
  /** Chat column opacity, 0–100 (read via --dsw-chat-surface). */
  chatSurfaceOpacity: number
  /** Composer input opacity, 0–100. */
  inputOpacity: number
  /** Code block / inline code opacity, 0–100. */
  codeBlockOpacity: number
  /** Dark-mode surface opacity, 0–100 (defaults to surfaceOpacity when unset). */
  darkSurfaceOpacity?: number
  /** Light-theme tone-blend wash over the wallpaper (CSS gradient; empty = none). */
  gradient: string
  /** Dark-theme scrim strength over the wallpaper, 0–100. */
  darkScrim: number
  /** Interface font stack override (empty = theme default). */
  fontFamily: string
  /** Code-font stack override (empty = theme default; pairs with fontFamily). */
  codeFontFamily: string
  /** Whole-UI font scale, 0.9–1.1 in 0.05 steps (1 = stock size). */
  fontScale: number
  /** Tint the scrollbar with the accent color. */
  scrollbarAccent: boolean
  /** Soft inset vignette on the app root. */
  vignette: boolean
  /**
   * Opt-in refinement knobs. Every knob defaults to its neutral value
   * ('inherit' / ''): the plugin changes nothing until the user picks one.
   */
  /** Corner radius: 'inherit' | 'sm' | 'md' | 'lg' | 'xl'. */
  cornerRadius: CornerRadius
  /** Surface shadow: 'inherit' | 'none' | 'soft' | 'medium' | 'strong'. */
  surfaceShadow: SurfaceShadow
  /** Focus glow: 'inherit' | 'on'. */
  focusGlow: FocusGlow
  /** Wallpaper tone overlay: 'inherit' | 'soft' | 'dim' | 'bright'. */
  wallpaperTone: WallpaperTone
  /** Dark-mode accent override ('' = inherit the main accent). */
  darkAccent: string
  /** Raw CSS appended verbatim (escape hatch for personal tweaks). */
  customCss: string
  /** Extra CSS custom properties written onto <html> (escape hatch). */
  customVars: Record<string, string>
  /** User-customizable keyboard shortcuts ('' disables an action). */
  shortcuts: ShortcutConfig
  /**
   * Feature whitelist: which independently selectable features to mount.
   * Absent or empty = every feature (backward compatible); present = only
   * the listed features register. Loader-level selection, not a theme knob.
   */
  features?: readonly PluginFeature[]
  /**
   * GitHub raw marketplace manifest URL. Read straight from the raw loader
   * config (never through normalizeConfig): the client apply() receives no
   * loader config, so this only takes effect when a caller passes it
   * directly; the remote default is used otherwise.
   */
  marketplaceUrl?: string
}

/** Frosted-glass levels: a high-level "how translucent" choice. */
export type GlassLevel = 'off' | 'light' | 'frosted' | 'mica'

/** Opt-in corner radius (inherit = keep the stock look). */
export type CornerRadius = 'inherit' | 'sm' | 'md' | 'lg' | 'xl'
/** Opt-in surface shadow (inherit = keep the stock look). */
export type SurfaceShadow = 'inherit' | 'none' | 'soft' | 'medium' | 'strong'
/** Opt-in focus glow (inherit = stock focus, no added ring). */
export type FocusGlow = 'inherit' | 'on'
/** Opt-in wallpaper tone overlay (inherit = untouched wallpaper). */
export type WallpaperTone = 'inherit' | 'soft' | 'dim' | 'bright'

/** Valid corner-radius values (in UI order). */
export const CORNER_RADIUS_LEVELS: readonly CornerRadius[] = ['inherit', 'sm', 'md', 'lg', 'xl']
/** Valid surface-shadow values (in UI order). */
export const SURFACE_SHADOW_LEVELS: readonly SurfaceShadow[] = ['inherit', 'none', 'soft', 'medium', 'strong']
/** Valid focus-glow values. */
export const FOCUS_GLOW_LEVELS: readonly FocusGlow[] = ['inherit', 'on']
/** Valid wallpaper-tone values (in UI order). */
export const WALLPAPER_TONE_LEVELS: readonly WallpaperTone[] = ['inherit', 'soft', 'dim', 'bright']

const isOneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  typeof value === 'string' && (options as readonly string[]).includes(value) ? value as T : fallback

export const isCornerRadius = (value: unknown): value is CornerRadius =>
  typeof value === 'string' && (CORNER_RADIUS_LEVELS as readonly string[]).includes(value)
export const isSurfaceShadow = (value: unknown): value is SurfaceShadow =>
  typeof value === 'string' && (SURFACE_SHADOW_LEVELS as readonly string[]).includes(value)
export const isFocusGlow = (value: unknown): value is FocusGlow =>
  typeof value === 'string' && (FOCUS_GLOW_LEVELS as readonly string[]).includes(value)
export const isWallpaperTone = (value: unknown): value is WallpaperTone =>
  typeof value === 'string' && (WALLPAPER_TONE_LEVELS as readonly string[]).includes(value)

/** Blur radius + saturation per glass level (mica ≈ subtle static tint, frosted ≈ strong acrylic). */
export const GLASS_LEVELS: Readonly<Record<GlassLevel, { blur: number; saturate: number }>> = {
  off: { blur: 0, saturate: 1 },
  light: { blur: 6, saturate: 1.15 },
  frosted: { blur: 14, saturate: 1.25 },
  mica: { blur: 22, saturate: 1.1 },
}

const isGlassLevel = (value: unknown): value is GlassLevel =>
  typeof value === 'string' && Object.hasOwn(GLASS_LEVELS, value)

/**
 * Resolve the effective blur radius: an explicitly set `wallpaperBlur` always
 * wins; otherwise the glass level's default blur applies. The saturation
 * factor always comes from the level.
 * @param raw - the user's raw config (explicitness is judged against it).
 * @returns the effective { blur, saturate } pair.
 */
export function resolveGlass(raw: Partial<CustomThemeConfig> | undefined): { blur: number; saturate: number } {
  const level = isGlassLevel(raw?.glass) ? raw.glass : DEFAULTS.glass
  const base = GLASS_LEVELS[level]
  const explicit = typeof raw?.wallpaperBlur === 'number'
    ? clampNumber(raw.wallpaperBlur, 0, 60, base.blur)
    : base.blur
  return { blur: explicit, saturate: base.saturate }
}

/**
 * Shipped defaults: deliberately neutral — no wallpaper, stock blue accent,
 * opaque surfaces. Out of the box the plugin changes nothing; users compose
 * their own look with a preset and/or explicit fields in their profile row.
 */
export const DEFAULTS: CustomThemeConfig = {
  preset: '',
  wallpaper: '',
  wallpaperBlur: 14,
  glass: 'frosted',
  accent: '#4176e6',
  autoAccent: false,
  surfaceOpacity: 100,
  sidebarOpacity: 100,
  chatSurfaceOpacity: 100,
  inputOpacity: 100,
  codeBlockOpacity: 100,
  gradient: '',
  darkScrim: 0,
  fontFamily: '',
  codeFontFamily: '',
  fontScale: 1,
  scrollbarAccent: false,
  vignette: false,
  cornerRadius: 'inherit',
  surfaceShadow: 'inherit',
  focusGlow: 'inherit',
  wallpaperTone: 'inherit',
  darkAccent: '',
  customCss: '',
  customVars: {},
  shortcuts: { ...SHORTCUT_DEFAULTS },
}

/** Clamp a number into [lo, hi], falling back when absent/non-finite. */
export const clampNumber = (value: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(hi, Math.max(lo, n))
}

/** Trim a string, returning the fallback when empty/non-string. */
export const cleanString = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback

const toBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

const toPercent = (value: unknown, fallback: number): number =>
  clampNumber(value, 0, 100, fallback)

const toVars = (value: unknown): Record<string, string> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string' || typeof raw === 'number') out[key] = String(raw)
  }
  return out
}

/** Coerce a shortcuts config: unknown entries dropped, strings trimmed, missing → defaults. */
export function normalizeShortcuts(value: unknown): ShortcutConfig {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<ShortcutConfig>
  const out = { ...SHORTCUT_DEFAULTS }
  for (const action of SHORTCUT_ACTIONS) {
    out[action] = typeof raw[action] === 'string' ? raw[action].trim() : out[action]
  }
  out.defaultWorkspace = typeof raw.defaultWorkspace === 'string' ? raw.defaultWorkspace.trim() : ''
  const modelShortcuts = Array.isArray(raw.modelShortcuts) ? raw.modelShortcuts : []
  out.modelShortcuts = modelShortcuts
    .filter((entry): entry is ModelShortcut =>
      typeof entry === 'object' && entry !== null
      && typeof entry.combo === 'string' && typeof entry.provider === 'string' && typeof entry.model === 'string')
    .map(entry => ({
      combo: entry.combo.trim(),
      provider: entry.provider.trim(),
      model: entry.model.trim(),
    }))
    .filter(entry => entry.combo !== '' && entry.provider !== '' && entry.model !== '')
  return out
}

/**
 * Resolve the enabled feature set from the loader config. The `features`
 * field is a whitelist: absent or empty means every feature mounts (backward
 * compatible); present means only the listed features register. Unknown ids
 * are dropped. Pure: no DOM access, fully unit-testable.
 * @param raw - the profile-level plugin config.
 * @returns the set of features to mount.
 */
export function resolveFeatures(raw: Partial<CustomThemeConfig> | undefined): Set<PluginFeature> {
  const list = raw?.features
  if (!Array.isArray(list) || list.length === 0) return new Set([...FEATURES])
  return new Set(list.filter((id): id is PluginFeature => (FEATURES as readonly string[]).includes(id)))
}

/**
 * Merge DEFAULTS ← preset ← explicit config, then coerce/clamp every field.
 * Pure: no DOM access, fully unit-testable.
 * @param raw - profile-level plugin config (may be partial / malformed).
 * @param preset - resolved preset partial (undefined when no preset matched).
 * @returns a normalized config ready for the applier.
 */
export function normalizeConfig(
  raw: Partial<CustomThemeConfig> | undefined,
  preset: Partial<CustomThemeConfig> | undefined,
): CustomThemeConfig {
  const merged = { ...DEFAULTS, ...preset, ...raw }
  const surfaceOpacity = toPercent(merged.surfaceOpacity, DEFAULTS.surfaceOpacity)
  // darkSurfaceOpacity is derived: explicit (raw/preset) value, else surfaceOpacity.
  const darkSurfaceOpacity = merged.darkSurfaceOpacity === undefined
    ? surfaceOpacity
    : toPercent(merged.darkSurfaceOpacity, surfaceOpacity)
  const glass = isGlassLevel(merged.glass) ? merged.glass : DEFAULTS.glass
  const { blur } = resolveGlass(raw)
  return {
    preset: cleanString(merged.preset, DEFAULTS.preset),
    wallpaper: cleanString(merged.wallpaper, DEFAULTS.wallpaper),
    wallpaperBlur: blur,
    glass,
    accent: cleanString(merged.accent, DEFAULTS.accent),
    autoAccent: toBoolean(merged.autoAccent, DEFAULTS.autoAccent),
    surfaceOpacity,
    sidebarOpacity: toPercent(merged.sidebarOpacity, DEFAULTS.sidebarOpacity),
    chatSurfaceOpacity: toPercent(merged.chatSurfaceOpacity, DEFAULTS.chatSurfaceOpacity),
    inputOpacity: toPercent(merged.inputOpacity, DEFAULTS.inputOpacity),
    codeBlockOpacity: toPercent(merged.codeBlockOpacity, DEFAULTS.codeBlockOpacity),
    darkSurfaceOpacity,
    gradient: typeof merged.gradient === 'string' && merged.gradient.trim() !== ''
      ? merged.gradient.trim()
      : '',
    darkScrim: toPercent(merged.darkScrim, DEFAULTS.darkScrim),
    fontFamily: typeof merged.fontFamily === 'string' ? merged.fontFamily.trim() : '',
    codeFontFamily: typeof merged.codeFontFamily === 'string' ? merged.codeFontFamily.trim() : '',
    // Whole-UI font scale: clamp to 0.9–1.1 and snap to 0.05 steps (1 = stock).
    fontScale: Math.round(clampNumber(merged.fontScale, 0.9, 1.1, DEFAULTS.fontScale) * 20) / 20,
    scrollbarAccent: toBoolean(merged.scrollbarAccent, DEFAULTS.scrollbarAccent),
    vignette: toBoolean(merged.vignette, DEFAULTS.vignette),
    cornerRadius: isOneOf(merged.cornerRadius, CORNER_RADIUS_LEVELS, DEFAULTS.cornerRadius),
    surfaceShadow: isOneOf(merged.surfaceShadow, SURFACE_SHADOW_LEVELS, DEFAULTS.surfaceShadow),
    focusGlow: isOneOf(merged.focusGlow, FOCUS_GLOW_LEVELS, DEFAULTS.focusGlow),
    wallpaperTone: isOneOf(merged.wallpaperTone, WALLPAPER_TONE_LEVELS, DEFAULTS.wallpaperTone),
    darkAccent: cleanString(merged.darkAccent, DEFAULTS.darkAccent),
    customCss: typeof merged.customCss === 'string' ? merged.customCss : '',
    customVars: toVars(merged.customVars),
    shortcuts: normalizeShortcuts(merged.shortcuts),
  }
}

/** All supported knob names (drives docs and future settings UI). */
export const CONFIG_KEYS: readonly (keyof CustomThemeConfig)[] = [
  'preset', 'wallpaper', 'wallpaperBlur', 'glass', 'accent', 'autoAccent',
  'surfaceOpacity', 'sidebarOpacity', 'chatSurfaceOpacity', 'inputOpacity',
  'codeBlockOpacity', 'darkSurfaceOpacity', 'gradient', 'darkScrim',
  'fontFamily', 'codeFontFamily', 'fontScale', 'scrollbarAccent', 'vignette', 'cornerRadius', 'surfaceShadow',
  'focusGlow', 'wallpaperTone', 'darkAccent', 'customCss', 'customVars',
  'shortcuts',
]
