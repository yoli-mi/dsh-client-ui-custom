/**
 * Settings-namespace contract shared by the Host registration (node half)
 * and the browser scope (client half). Node-safe: no DOM, no React.
 */

/** Settings namespace owned by ui-custom (runtime-editable section). */
export const UI_CUSTOM_SETTINGS_NS = 'ui-custom'

/**
 * Individually selectable plugin features. The loader config's `features`
 * field is a whitelist: absent or empty = every feature mounts (backward
 * compatible); present = only the listed features register. Each feature
 * owns its settings rows / pages, so an unlisted feature is simply absent
 * from the Settings surface and the DOM.
 */
export const FEATURES = ['history', 'markdown', 'appearance', 'marketplace', 'shortcuts', 'usage'] as const

/** One opt-in plugin feature id (see {@link FEATURES}). */
export type PluginFeature = typeof FEATURES[number]

/**
 * Runtime-editable theme fields (the "外观" section). Mirrors
 * CustomThemeConfig. Keys are always present in the resolved section; values
 * may be undefined while the scope has not resolved yet.
 */
export interface ThemeSection {
  wallpaper: string | undefined
  glass: string | undefined
  accent: string | undefined
  autoAccent: boolean | undefined
  surfaceOpacity: number | undefined
  sidebarOpacity: number | undefined
  chatSurfaceOpacity: number | undefined
  inputOpacity: number | undefined
  codeBlockOpacity: number | undefined
  darkSurfaceOpacity: number | undefined
  gradient: string | undefined
  darkScrim: number | undefined
  fontFamily: string | undefined
  /** Code-font stack override ('' = theme default; pairs with fontFamily). */
  codeFontFamily: string | undefined
  /** Whole-UI font scale, 0.9–1.1 (1 = stock size, step 0.05). */
  fontScale: number | undefined
  scrollbarAccent: boolean | undefined
  vignette: boolean | undefined
  /**
   * Opt-in refinement knobs. Every knob defaults to its neutral value
   * ('inherit' / ''), so installing the plugin changes nothing: each maps to a
   * --dsu-* variable that is only written when the user picks a non-neutral
   * value (and 'inherit' keeps the stock look).
   */
  /** Corner radius: 'inherit' | 'sm' | 'md' | 'lg' | 'xl'. */
  cornerRadius: string | undefined
  /** Surface shadow: 'inherit' | 'none' | 'soft' | 'medium' | 'strong'. */
  surfaceShadow: string | undefined
  /** Focus glow: 'inherit' | 'on'. */
  focusGlow: string | undefined
  /** Wallpaper tone overlay: 'inherit' | 'soft' | 'dim' | 'bright'. */
  wallpaperTone: string | undefined
  /** Dark-mode accent override ('' = inherit the main accent). */
  darkAccent: string | undefined
  /**
   * User's own presets ("另存为我的预设"): id → JSON string of
   * `{ name, config }`. Stored in the settings document so they survive
   * reloads and can be one-click restored from the preset gallery.
   */
  myPresets?: Record<string, string>
  /**
   * Render messages the user sends as Markdown (headings / lists / code
   * blocks). Defaults to true; the General-settings row can turn it off for
   * plain-text display.
   */
  renderUserMarkdown?: boolean
}

/** One one-to-one model shortcut: a key combo that jumps to a specific model. */
export interface ModelShortcut {
  /** Key-combo spec ('' = unbound). */
  combo: string
  /** Catalog provider id (the group id in the model catalog). */
  provider: string
  /** Catalog model id within the provider. */
  model: string
}

/** The runtime-editable shortcuts section stored in the user-settings document. */
export interface ShortcutsSection {
  /** Key combo for new-conversation ('' / absent = unset). */
  newConversation?: string
  /** Key combo for next-model cycling ('' / absent = unset). */
  switchModel?: string
  /** Key combo for thinking-effort cycling ('' / absent = unset). */
  cycleThinking?: string
  /** Composer send gesture (native default: Enter). */
  sendMessage?: string
  /** Composer newline gesture (native default: Shift+Enter). */
  newline?: string
  /** Toggle the app-usage panel (default: Mod+Alt+U). */
  usagePanel?: string
  /** Workspace id the new-conversation shortcut opens ('' / absent = current/recent). */
  defaultWorkspace?: string
  /** One-to-one model shortcuts (combo → a specific model). */
  modelShortcuts?: ModelShortcut[]
}

/** Where the floating history strip can sit relative to the conversation. */
export const HISTORY_POSITIONS = ['left', 'right', 'off'] as const

/** One selectable history-strip side ('off' hides the strip). */
export type HistoryPosition = typeof HISTORY_POSITIONS[number]

/** Default side when the user-settings document has no override. Off by
 * default: a fresh install shows no floating history strip until the user
 * turns it on in General settings. */
export const DEFAULT_HISTORY_POSITION: HistoryPosition = 'off'

/** How many recent turns the strip shows when the user has no override (0 = all). */
export const DEFAULT_HISTORY_LIMIT = 10

/** History-strip preferences stored in the user-settings document. */
export interface HistorySection {
  /** How many recent turns the strip shows (0 = show all). */
  historyLimit?: number
  /** Which side the floating strip sits on ('off' hides it). */
  historyPosition?: HistoryPosition
  /**
   * Pinned turn numbers, keyed by session id. A pinned turn ignores the
   * strip's count limit — it always shows, marked with the theme-accent
   * frame. Only meaningful while historyPosition is not 'off'.
   */
  pinnedTurns?: Record<string, number[]>
}

/** The plugin's full settings section: theme + shortcuts + history, flat on one namespace. */
export interface UiCustomSection extends ThemeSection, ShortcutsSection, HistorySection {
  /**
   * Marketplace catalog source(s): raw manifest JSON URL(s) and/or GitHub
   * repo URL(s), comma/newline separated. Each GitHub repo is probed for its
   * `marketplace.json` on the `main` and `master` branches; when neither
   * exists the repo is resolved from its GitHub metadata (name, description,
   * package.json) and listed directly. Empty reverts to the shipped default
   * URL. Seeded from the loader config (`marketplaceUrl`) so a profile row can
   * configure it; lives in the settings namespace so the browser scope can
   * read it (the client never receives the loader config).
   */
  marketplaceUrl?: string
  /**
   * Auto-discover third-party plugins from GitHub: searches repos tagged with
   * the `dsh-plugin` topic and a `dsh-` name prefix, sorted by stars, and
   * merges them after the configured sources. Defaults to true; set false to
   * show only the configured sources.
   */
  discoverGitHub?: boolean
  /** Discovery sort: by stars, or by publish date (recent first). */
  discoverSort?: 'stars' | 'date'
  /** How many discovered entries to show (1–100, default 30). */
  discoverLimit?: number
}
