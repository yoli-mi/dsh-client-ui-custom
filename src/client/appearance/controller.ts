/**
 * Appearance settings controller: a staged draft over the theme fields of the
 * ui-custom settings scope, projected into a snapshot store the section
 * renders. Values = the scope's resolved theme (user overrides over the
 * loader base); save writes changed fields, reset-all unsets them (reverting
 * to the loader defaults). Preview renders the draft to the document WITHOUT
 * touching the scope — the user decides after seeing the effect; cancel
 * re-applies the saved values.
 */
import { createSnapshotStore, type SettingsScope, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { CustomThemeConfig } from '../config.ts'
import { DEFAULTS, normalizeConfig } from '../config.ts'
import { PRESETS, PRESET_MAP } from '../presets.ts'
import { resolveFontPreset } from '../font-presets.ts'
import { randomInspirationConfig } from '../color.ts'
import { previewBar } from '../preview-bar.ts'
import type { ThemeSection } from '../../shared.ts'
import { configFromThemeSection } from '../theme-section.ts'

/** The theme fields the form edits. */
export type ThemeField =
  | 'wallpaper' | 'glass' | 'accent' | 'autoAccent'
  | 'surfaceOpacity' | 'sidebarOpacity' | 'chatSurfaceOpacity' | 'inputOpacity' | 'codeBlockOpacity' | 'darkSurfaceOpacity'
  | 'gradient' | 'darkScrim' | 'fontFamily' | 'codeFontFamily' | 'fontScale' | 'scrollbarAccent' | 'vignette'
  | 'cornerRadius' | 'surfaceShadow' | 'focusGlow' | 'wallpaperTone' | 'darkAccent'

const THEME_FIELDS: readonly ThemeField[] = [
  'wallpaper', 'glass', 'accent', 'autoAccent',
  'surfaceOpacity', 'sidebarOpacity', 'chatSurfaceOpacity', 'inputOpacity', 'codeBlockOpacity', 'darkSurfaceOpacity',
  'gradient', 'darkScrim', 'fontFamily', 'codeFontFamily', 'fontScale', 'scrollbarAccent', 'vignette',
  'cornerRadius', 'surfaceShadow', 'focusGlow', 'wallpaperTone', 'darkAccent',
]

/** The parameter groups the appearance page shows as cards (each has a
 * "恢复本组默认" reset). */
export type ParamGroup = 'background' | 'color' | 'surface' | 'typography' | 'refine'

/** Field list per group — drives the group reset. */
const GROUP_FIELDS: Readonly<Record<ParamGroup, readonly ThemeField[]>> = {
  background: ['wallpaper', 'glass', 'gradient', 'darkScrim', 'wallpaperTone'],
  color: ['accent', 'autoAccent', 'darkAccent'],
  surface: ['surfaceOpacity', 'sidebarOpacity', 'chatSurfaceOpacity', 'inputOpacity', 'codeBlockOpacity', 'darkSurfaceOpacity'],
  typography: ['fontFamily', 'codeFontFamily', 'fontScale'],
  refine: ['cornerRadius', 'surfaceShadow', 'focusGlow', 'scrollbarAccent', 'vignette'],
}

/** Neutral (stock-look) value per group field — what 恢复本组默认 writes. */
const GROUP_NEUTRALS: Readonly<Record<ParamGroup, Partial<ThemeSection>>> = {
  background: {
    wallpaper: DEFAULTS.wallpaper, glass: DEFAULTS.glass, gradient: DEFAULTS.gradient,
    darkScrim: DEFAULTS.darkScrim, wallpaperTone: DEFAULTS.wallpaperTone,
  },
  color: { accent: DEFAULTS.accent, autoAccent: DEFAULTS.autoAccent, darkAccent: DEFAULTS.darkAccent },
  surface: {
    surfaceOpacity: DEFAULTS.surfaceOpacity, sidebarOpacity: DEFAULTS.sidebarOpacity,
    chatSurfaceOpacity: DEFAULTS.chatSurfaceOpacity, inputOpacity: DEFAULTS.inputOpacity,
    codeBlockOpacity: DEFAULTS.codeBlockOpacity, darkSurfaceOpacity: 100,
  },
  typography: { fontFamily: DEFAULTS.fontFamily, codeFontFamily: DEFAULTS.codeFontFamily, fontScale: DEFAULTS.fontScale },
  refine: {
    cornerRadius: DEFAULTS.cornerRadius, surfaceShadow: DEFAULTS.surfaceShadow, focusGlow: DEFAULTS.focusGlow,
    scrollbarAccent: DEFAULTS.scrollbarAccent, vignette: DEFAULTS.vignette,
  },
}

/** One user-saved preset ("另存为我的预设"). */
export interface MyPreset {
  id: string
  name: string
  config: Partial<CustomThemeConfig>
}

/** The preset (shipped or user) the staged theme currently matches. */
export interface ActivePreset {
  kind: 'shipped' | 'my'
  id: string
}

/** What the section renders. */
export interface AppearanceSettingsState {
  status: 'loading' | 'ready' | 'unavailable'
  writable: boolean
  /** Effective theme values (settings over loader defaults). */
  values: ThemeSection
  /** Staged draft the user is editing. */
  draft: ThemeSection
  dirty: boolean
  saving: boolean
  /** Whether the draft is currently rendered to the document (preview mode). */
  previewing: boolean
  /** The user's own presets (parsed from the settings document). */
  myPresets: readonly MyPreset[]
  /** The preset the staged theme matches, framed in the gallery (null = none). */
  activePreset: ActivePreset | null
}

/** The settings-section registration face. */
export interface AppearanceInjected {
  hooks: {
    appearance: HostObservable<AppearanceSettingsState>
  }
  setField(field: ThemeField, value: string | number | boolean): void
  /** Load a font pairing (ui + code stacks) into the draft. */
  applyFontPreset(id: string): void
  /** Generate a harmonious random theme from the palette algorithm. */
  randomInspiration(): void
  /** Reset one parameter group (background / color / …) to neutral defaults. */
  resetGroup(group: ParamGroup): void
  /** Render the staged draft to the document without saving. */
  preview(): void
  /** Load a shipped preset into the draft and preview it immediately. */
  applyPreset(id: string): void
  /** Save the current draft as a user preset (name shown in the gallery). */
  saveMyPreset(name: string): void
  /** Remove one user preset. */
  removeMyPreset(id: string): void
  /** Load a user preset into the draft and preview it immediately. */
  applyMyPreset(id: string): void
  /** Revert the document to the saved theme (leaves the draft intact). */
  cancelPreview(): void
  save(): void
  resetAll(): void
}

/** Serialize a user preset record for the settings document. */
const serializeMyPreset = (name: string, config: Partial<CustomThemeConfig>): string =>
  JSON.stringify({ name, config })

/** Map a theme section to a partial config, dropping undefined fields. */
function themeSectionToPartial(section: ThemeSection): Partial<CustomThemeConfig> {
  const out: Partial<CustomThemeConfig> = {}
  for (const field of THEME_FIELDS) {
    const value = section[field]
    if (value !== undefined) (out as Record<string, unknown>)[field] = value
  }
  return out
}

/** Parse the settings document's myPresets dict into records (lenient). */
function parseMyPresets(raw: unknown): MyPreset[] {
  if (typeof raw !== 'object' || raw === null) return []
  const out: MyPreset[] = []
  for (const [id, value] of Object.entries(raw)) {
    if (typeof value !== 'string') continue
    try {
      const parsed = JSON.parse(value) as { name?: unknown; config?: unknown }
      const name = typeof parsed.name === 'string' && parsed.name !== '' ? parsed.name : id
      if (typeof parsed.config !== 'object' || parsed.config === null) continue
      out.push({ id, name, config: parsed.config as Partial<CustomThemeConfig> })
    } catch {
      // malformed record — skip
    }
  }
  return out
}

const themeOf = (config: CustomThemeConfig): ThemeSection => ({
  wallpaper: config.wallpaper,
  glass: config.glass,
  accent: config.accent,
  autoAccent: config.autoAccent,
  surfaceOpacity: config.surfaceOpacity,
  sidebarOpacity: config.sidebarOpacity,
  chatSurfaceOpacity: config.chatSurfaceOpacity,
  inputOpacity: config.inputOpacity,
  codeBlockOpacity: config.codeBlockOpacity,
  darkSurfaceOpacity: config.darkSurfaceOpacity,
  gradient: config.gradient,
  darkScrim: config.darkScrim,
  fontFamily: config.fontFamily,
  codeFontFamily: config.codeFontFamily,
  fontScale: config.fontScale,
  scrollbarAccent: config.scrollbarAccent,
  vignette: config.vignette,
  cornerRadius: config.cornerRadius,
  surfaceShadow: config.surfaceShadow,
  focusGlow: config.focusGlow,
  wallpaperTone: config.wallpaperTone,
  darkAccent: config.darkAccent,
})

/** Bridges the ui-custom settings scope onto the appearance form. */
export class AppearanceSettingsController {
  readonly store: SnapshotStore<AppearanceSettingsState>
  private values: ThemeSection
  private draft: ThemeSection
  /** Whether the user staged a field edit; the draft follows the scope until then. */
  private touched = false
  private saving = false
  private previewing = false

  /**
   * @param scope - the bound settings scope for the ui-custom namespace.
   * @param defaults - the normalized loader config (fallback for absent fields).
   * @param onPreview - applies a merged config to the document (preview/cancel).
   */
  constructor(
    private readonly scope: SettingsScope<ThemeSection>,
    private readonly defaults: CustomThemeConfig,
    private readonly onPreview: (config: CustomThemeConfig) => void,
  ) {
    // Seed the draft from the scope's current resolved section (schema
    // defaults when it has not loaded yet). Seeding from `defaults` alone
    // left the form permanently "dirty" against the real document: the first
    // sync that brought real values in would refuse to adopt them into the
    // draft, so the form showed defaults and a save would overwrite the real
    // config with them.
    this.values = themeOf(configFromThemeSection(defaults, scope.getSnapshot().value))
    this.draft = { ...this.values }
    this.store = createSnapshotStore<AppearanceSettingsState>({
      status: 'loading', writable: false,
      values: this.values, draft: this.draft, dirty: false, saving: false, previewing: false, myPresets: [],
      activePreset: null,
    })
    this.sync()
  }

  private sync(): void {
    const snapshot = this.scope.getSnapshot()
    const config = configFromThemeSection(this.defaults, snapshot.value)
    this.values = themeOf(config)
    // Follow the scope (the first load, an external document reload) until the
    // user stages an edit; an in-progress draft must not be clobbered.
    if (!this.touched) this.draft = { ...this.values }
    // Any external scope change re-applies the SAVED theme (index.ts
    // applyTheme); a transient preview no longer represents the document.
    this.previewing = false
    previewBar.hide()
    const myPresets = parseMyPresets(snapshot.value?.myPresets)
    this.store.update((state) => {
      state.status = snapshot.status
      state.writable = snapshot.writable
      state.values = this.values
      state.draft = this.draft
      state.dirty = this.dirty()
      state.saving = this.saving
      state.previewing = this.previewing
      state.myPresets = myPresets
      state.activePreset = this.recomputeActivePreset(myPresets)
    })
  }

  private dirty(): boolean {
    return THEME_FIELDS.some((field) => this.draft[field] !== this.values[field])
  }

  private publish(): void {
    this.store.update((state) => {
      state.values = this.values
      state.draft = this.draft
      state.dirty = this.dirty()
      state.saving = this.saving
      state.previewing = this.previewing
      state.activePreset = this.recomputeActivePreset(state.myPresets)
    })
  }

  /**
   * The preset (shipped or user) whose full config the staged theme matches —
   * its card is framed in the gallery so the active theme is visible at a
   * glance. The draft is the source of truth: it mirrors the saved theme until
   * the user stages an edit, and once a preset is clicked (staged) or previewed
   * it reflects exactly the theme the user is working with / looking at.
   */
  private recomputeActivePreset(myPresets: readonly MyPreset[]): ActivePreset | null {
    for (const preset of PRESETS) {
      if (this.matchesPreset(preset.config)) return { kind: 'shipped', id: preset.id }
    }
    for (const preset of myPresets) {
      if (this.matchesPreset(preset.config)) return { kind: 'my', id: preset.id }
    }
    return null
  }

  /** True when every theme field of the staged draft equals the preset's. */
  private matchesPreset(config: Partial<CustomThemeConfig>): boolean {
    const presetSection = themeOf(normalizeConfig(undefined, config))
    return THEME_FIELDS.every((field) => presetSection[field] === this.draft[field])
  }

  /** Render a theme section to the document via the injected applier. */
  private applyTheme(section: ThemeSection): void {
    // configFromThemeSection layers the section over the loader defaults and
    // produces a full normalized config (undefined fields fall back), so a
    // preview never drops the non-theme knobs (preset / customCss / …).
    this.onPreview(configFromThemeSection(this.defaults, section))
  }

  /** Stage one field edit (re-applies the live preview when already previewing). */
  setField(field: ThemeField, value: string | number | boolean): void {
    // The computed key defeats per-field narrowing; the stored draft is read
    // back through per-field accessors, so the cast is type-only.
    this.touched = true
    this.draft = { ...this.draft, [field]: value } as ThemeSection
    if (this.previewing) this.applyTheme(this.draft)
    this.publish()
  }

  /** Render the staged draft to the document WITHOUT saving (the scope is untouched). */
  preview(): void {
    if (!this.dirty()) return
    this.previewing = true
    previewBar.show()
    this.applyTheme(this.draft)
    this.publish()
  }

  /**
   * Load a preset config into the draft — staging only, no preview. Shipped
   * presets are pure color-gradient themes and ship no wallpaper — the
   * gradient IS the background, so loading one clears the wallpaper instead
   * of letting it dilute the gradient (the saved wallpaper is untouched;
   * cancelPreview restores it, and the 壁纸 field re-adds it). The user then
   * enters the preview through the shared 预览 button, exactly like any
   * manual edit — one unified preview path.
   * @param config - the preset's partial config.
   */
  private loadPresetConfig(config: Partial<CustomThemeConfig>): void {
    const presetTheme = themeOf(configFromThemeSection(this.defaults, config as ThemeSection))
    const wallpaper = typeof config.wallpaper === 'string' && config.wallpaper !== ''
      ? config.wallpaper
      : ''
    this.touched = true
    this.draft = { ...presetTheme, wallpaper }
    this.previewing = false
    this.publish()
  }

  /** Load a shipped preset into the draft (staging only — the 预览 button previews). */
  applyPreset(id: string): void {
    const preset = PRESET_MAP.get(id)?.config
    if (preset === undefined) return
    this.loadPresetConfig(preset)
  }

  /** Save the current draft as a user preset (name shown in the gallery). */
  async saveMyPreset(name: string): Promise<void> {
    const clean = name.trim()
    if (clean === '') return
    const config = themeSectionToPartial(this.draft)
    const record = serializeMyPreset(clean, config)
    const current = this.scope.getSnapshot().value?.myPresets ?? {}
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    await this.scope.set('myPresets', { ...current, [id]: record })
    this.sync()
  }

  /** Remove one user preset. */
  async removeMyPreset(id: string): Promise<void> {
    const current = this.scope.getSnapshot().value?.myPresets ?? {}
    if (!(id in current)) return
    const next = { ...current }
    delete next[id]
    if (Object.keys(next).length === 0) await this.scope.unset('myPresets')
    else await this.scope.set('myPresets', next)
    this.sync()
  }

  /** Load a user preset into the draft (staging only — the 预览 button previews). */
  applyMyPreset(id: string): void {
    const preset = this.store.getSnapshot().myPresets.find((entry) => entry.id === id)
    if (preset === undefined) return
    this.loadPresetConfig(preset.config)
  }

  /** Load a font pairing (ui + code stacks) into the draft. */
  applyFontPreset(id: string): void {
    const fields = resolveFontPreset(id)
    this.touched = true
    this.draft = { ...this.draft, fontFamily: fields.fontFamily, codeFontFamily: fields.codeFontFamily } as ThemeSection
    if (this.previewing) this.applyTheme(this.draft)
    this.publish()
  }

  /** Generate a harmonious random theme from the palette algorithm (staged). */
  randomInspiration(): void {
    this.loadPresetConfig(randomInspirationConfig())
  }

  /** Reset one parameter group to the neutral (stock) defaults. */
  resetGroup(group: ParamGroup): void {
    const neutral = GROUP_NEUTRALS[group]
    let next = this.draft
    for (const field of GROUP_FIELDS[group]) {
      next = { ...next, [field]: neutral[field] } as ThemeSection
    }
    this.touched = true
    this.draft = next
    if (this.previewing) this.applyTheme(this.draft)
    this.publish()
  }

  /** Revert the document to the saved theme (leaves the staged draft for further edits). */
  cancelPreview(): void {
    if (!this.previewing) return
    this.previewing = false
    previewBar.hide()
    this.applyTheme(this.values)
    this.publish()
  }

  /** Restore every field to the loader defaults (unsets the user overrides). */
  async resetAll(): Promise<void> {
    if (this.saving) return
    this.saving = true
    this.publish()
    try {
      for (const field of THEME_FIELDS) await this.scope.unset(field)
    } finally {
      this.saving = false
      this.touched = false
      this.sync()
    }
  }

  /** Write every changed field through the scope (live re-apply on publish). */
  async save(): Promise<void> {
    if (!this.dirty() || this.saving) return
    this.saving = true
    this.publish()
    try {
      for (const field of THEME_FIELDS) {
        const next = this.draft[field]
        if (next === this.values[field]) continue
        await this.scope.set(field, next)
      }
    } finally {
      this.saving = false
      this.touched = false
      this.sync()
    }
  }

  /** Wire the controller: subscribe the scope and expose the form actions. */
  mount(): { dispose: () => void; actions: Pick<AppearanceInjected, 'setField' | 'applyFontPreset' | 'randomInspiration' | 'resetGroup' | 'preview' | 'applyPreset' | 'saveMyPreset' | 'removeMyPreset' | 'applyMyPreset' | 'cancelPreview' | 'save' | 'resetAll'> } {
    const dispose = this.scope.subscribe(() => this.sync())
    return {
      dispose,
      actions: {
        setField: (field, value) => this.setField(field, value),
        applyFontPreset: (id) => this.applyFontPreset(id),
        randomInspiration: () => this.randomInspiration(),
        resetGroup: (group) => this.resetGroup(group),
        preview: () => this.preview(),
        applyPreset: (id) => this.applyPreset(id),
        saveMyPreset: (name) => { void this.saveMyPreset(name) },
        removeMyPreset: (id) => { void this.removeMyPreset(id) },
        applyMyPreset: (id) => this.applyMyPreset(id),
        cancelPreview: () => this.cancelPreview(),
        save: () => { void this.save() },
        resetAll: () => { void this.resetAll() },
      },
    }
  }
}
