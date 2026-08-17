/**
 * Web-surface theme plugin, node half: registers the runtime-editable
 * settings section (theme "外观" + shortcuts "快捷键" pages) so the browser
 * scope can read/write it. The theme itself is pure browser work.
 */
import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import {
  DEFAULT_HISTORY_LIMIT, DEFAULT_HISTORY_POSITION, FEATURES, HISTORY_POSITIONS, UI_CUSTOM_SETTINGS_NS,
} from './shared.ts'
import type { ShortcutConfig } from './client/config.ts'
import type { HistoryPosition, PluginFeature, ThemeSection } from './shared.ts'

/** The full ui-custom section schema (schemastery defaults = the plugin's neutral defaults). */
const UiCustomSectionSchema = z.object({
  // theme
  wallpaper: z.string().default(''),
  glass: z.string().default('frosted'),
  accent: z.string().default('#4176e6'),
  autoAccent: z.boolean().default(false),
  surfaceOpacity: z.number().default(100),
  sidebarOpacity: z.number().default(100),
  chatSurfaceOpacity: z.number().default(100),
  inputOpacity: z.number().default(100),
  codeBlockOpacity: z.number().default(100),
  darkSurfaceOpacity: z.number().default(100),
  gradient: z.string().default(''),
  darkScrim: z.number().default(0),
  fontFamily: z.string().default(''),
  codeFontFamily: z.string().default(''),
  fontScale: z.number().default(1),
  scrollbarAccent: z.boolean().default(false),
  vignette: z.boolean().default(false),
  // opt-in refinement knobs (neutral defaults: the plugin changes nothing)
  cornerRadius: z.string().default('inherit'),
  surfaceShadow: z.string().default('inherit'),
  focusGlow: z.string().default('inherit'),
  wallpaperTone: z.string().default('inherit'),
  darkAccent: z.string().default(''),
  // user's own presets: id → JSON string of { name, config }
  myPresets: z.dict(z.string()).default({}),
  // render the user's own messages as Markdown (General-settings toggle)
  renderUserMarkdown: z.boolean().default(false),
  // shortcuts
  newConversation: z.string().default(''),
  switchModel: z.string().default(''),
  cycleThinking: z.string().default(''),
  sendMessage: z.string().default('Enter'),
  newline: z.string().default('Shift+Enter'),
  usagePanel: z.string().default(''),
  defaultWorkspace: z.string().default(''),
  modelShortcuts: z.array(z.object({
    combo: z.string().default(''),
    provider: z.string().default(''),
    model: z.string().default(''),
  })).default([]),
  // history strip: recent-turns limit (0 = show all) + side (left/right/off)
  historyLimit: z.number().default(DEFAULT_HISTORY_LIMIT),
  historyPosition: z.union([...HISTORY_POSITIONS]).default(DEFAULT_HISTORY_POSITION),
  // pinned turns per session (turn numbers that ignore the count limit)
  pinnedTurns: z.dict(z.array(z.number())).default({}),
  // marketplace catalog source(s): raw manifest URL(s) / GitHub repo URL(s)
  marketplaceUrl: z.string().default(''),
  // auto-discover dsh-plugin topic repos from GitHub (merged after sources)
  discoverGitHub: z.boolean().default(false),
  // discovery sort (stars / publish date) and how many entries to show
  discoverSort: z.union(['stars', 'date']).default('stars'),
  discoverLimit: z.number().default(30),
  // feature whitelist: which independently selectable features mount on the
  // web client (absent/empty = all; see resolveFeatures on the client side)
  features: z.array(z.union([...FEATURES])).default([]),
})

/** Plugin config shape accepted at the loader layer (flat theme + nested shortcuts). */
interface UiCustomConfig extends Partial<ThemeSection> {
  /**
   * Feature whitelist: which independently selectable features to mount
   * (history / markdown / appearance / marketplace / shortcuts / usage).
   * Absent or empty = every feature (backward compatible); present = only
   * the listed features register on the web client.
   */
  features?: readonly PluginFeature[]
  shortcuts?: Partial<ShortcutConfig>
  /** History strip recent-turns limit (0 = show all). */
  historyLimit?: number
  /** History strip side ('left' / 'right') or hidden ('off'). */
  historyPosition?: HistoryPosition
  /** Pinned turn numbers per session (ignore the strip's count limit). */
  pinnedTurns?: Record<string, number[]>
  /**
   * Marketplace catalog source(s): raw manifest JSON URL(s) and/or GitHub
   * repo URL(s), comma/newline separated. Seeded into the settings namespace
   * so the browser scope can read it.
   */
  marketplaceUrl?: string
  /** Auto-discover `dsh-plugin` topic repos from GitHub (default true). */
  discoverGitHub?: boolean
  /** Discovery sort: 'stars' (default) or 'date' (publish date, recent first). */
  discoverSort?: 'stars' | 'date'
  /** How many discovered entries to show (default 30). */
  discoverLimit?: number
}

/**
 * Host plugin body: expose the ui-custom settings namespace to the web
 * client when the settings service is composed. The namespace's composition
 * base carries the loader config (flat theme fields + nested shortcuts), so a
 * cleared field reverts to the loader default and the settings pages layer on
 * top of it.
 * @param ctx - Host context that may acquire the settings service.
 * @param config - the plugin's loader-layer config.
 */
export function apply(ctx: Context, config?: UiCustomConfig): void {
  ctx.inject(['settings'], (settingsCtx) => {
    const shortcuts = config?.shortcuts
    settingsCtx.settings.register(settingsNamespace(UI_CUSTOM_SETTINGS_NS), UiCustomSectionSchema, {
      base: {
        wallpaper: config?.wallpaper ?? '',
        glass: config?.glass ?? 'frosted',
        accent: config?.accent ?? '#4176e6',
        autoAccent: config?.autoAccent ?? false,
        surfaceOpacity: config?.surfaceOpacity ?? 100,
        sidebarOpacity: config?.sidebarOpacity ?? 100,
        chatSurfaceOpacity: config?.chatSurfaceOpacity ?? 100,
        inputOpacity: config?.inputOpacity ?? 100,
        codeBlockOpacity: config?.codeBlockOpacity ?? 100,
        darkSurfaceOpacity: config?.darkSurfaceOpacity ?? 100,
        gradient: config?.gradient ?? '',
        darkScrim: config?.darkScrim ?? 0,
        fontFamily: config?.fontFamily ?? '',
        codeFontFamily: config?.codeFontFamily ?? '',
        fontScale: config?.fontScale ?? 1,
        scrollbarAccent: config?.scrollbarAccent ?? false,
        vignette: config?.vignette ?? false,
        cornerRadius: config?.cornerRadius ?? 'inherit',
        surfaceShadow: config?.surfaceShadow ?? 'inherit',
        focusGlow: config?.focusGlow ?? 'inherit',
        wallpaperTone: config?.wallpaperTone ?? 'inherit',
        darkAccent: config?.darkAccent ?? '',
        myPresets: config?.myPresets ?? {},
        renderUserMarkdown: config?.renderUserMarkdown ?? false,
        newConversation: shortcuts?.newConversation ?? '',
        switchModel: shortcuts?.switchModel ?? '',
        cycleThinking: shortcuts?.cycleThinking ?? '',
        sendMessage: shortcuts?.sendMessage ?? 'Enter',
        newline: shortcuts?.newline ?? 'Shift+Enter',
        usagePanel: shortcuts?.usagePanel ?? '',
        defaultWorkspace: shortcuts?.defaultWorkspace ?? '',
        modelShortcuts: shortcuts?.modelShortcuts ?? [],
        historyLimit: config?.historyLimit ?? DEFAULT_HISTORY_LIMIT,
        historyPosition: config?.historyPosition ?? DEFAULT_HISTORY_POSITION,
        pinnedTurns: config?.pinnedTurns ?? {},
        marketplaceUrl: config?.marketplaceUrl ?? '',
        discoverGitHub: config?.discoverGitHub ?? false,
        discoverSort: config?.discoverSort ?? 'stars',
        discoverLimit: config?.discoverLimit ?? 30,
        features: config?.features ? [...config.features] : [],
      },
    })
  })
}
