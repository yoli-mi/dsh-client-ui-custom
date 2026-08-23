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
export const FEATURES = ['history', 'markdown', 'appearance', 'marketplace', 'shortcuts', 'usage', 'motion'] as const

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
  /**
   * Conversation entrance motion: when a conversation loads or switches,
   * freshly mounted messages fade in with a subtle rise instead of popping in
   * at once. Defaults to true; the 动效 settings section can turn it off.
   */
  motionEnabled?: boolean
  /**
   * Which entrance-motion style fresh messages use ('fade-up' default;
   * see MOTION_STYLES). Only meaningful while motionEnabled is on.
   */
  motionStyle?: MotionStyle
  /**
   * Which entrance-motion style the sidebar tree uses ('slide-left' default;
   * see SIDEBAR_MOTION_STYLES). Independently selectable from the
   * transcript's style — the sidebar rail suits horizontal motion.
   */
  sidebarMotionStyle?: SidebarMotionStyle
  /**
   * Sidebar motion (initial tree entrance + workspace-group expand rows).
   * Defaults to true; the 动效 settings section can turn it off.
   */
  sidebarMotionEnabled?: boolean
  /**
   * The persistent selection-box trace on the active sidebar row. Defaults
   * to true; the 动效 settings section can turn it off.
   */
  selectionMotionEnabled?: boolean
  /**
   * The blank-session entrance (a brand-new conversation's welcome dialog
   * fades in). Defaults to true; the 动效 settings section can turn it off.
   */
  newChatMotionEnabled?: boolean
  /**
   * Which entrance style the blank-session (new conversation) dialog uses
   * ('reveal' default; see NEW_CHAT_MOTION_STYLES).
   */
  newChatMotionStyle?: NewChatMotionStyle
  /**
   * Settings-panel motion: the settings dialog expands from the lower-left,
   * nav rows fade their highlight, and section pages fade in on switch.
   * Defaults to true; the 动效 settings section can turn it off.
   */
  settingsMotionEnabled?: boolean
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

/** One selectable conversation entrance-motion style. */
export const MOTION_STYLES = ['fade-up', 'fade', 'rise-scale', 'slide-in', 'blur-in', 'scale-in'] as const

/** One entrance-motion style id (see {@link MOTION_STYLES}). */
export type MotionStyle = typeof MOTION_STYLES[number]

/** Default entrance style when the user-settings document has no override. */
export const DEFAULT_MOTION_STYLE: MotionStyle = 'fade-up'

/** Guard for a MotionStyle value (unknown ids fall back to the default). */
export const isMotionStyle = (value: unknown): value is MotionStyle =>
  typeof value === 'string' && (MOTION_STYLES as readonly string[]).includes(value)

/**
 * Selectable sidebar entrance-motion styles. The sidebar is a horizontal
 * rail, so its motion is horizontal (slide from the screen edge) or a plain
 * cross-fade — deliberately distinct from the transcript's vertical styles.
 * The tree rows also suit a drop-in (slide-down) or a vertical unfold
 * (expand), both of which read as rows settling into the list.
 */
export const SIDEBAR_MOTION_STYLES = ['slide-left', 'fade', 'expand', 'slide-down'] as const

/**
 * Selectable new-conversation entrance styles. The welcome dialog is a LARGE
 * surface, so its motion is deliberately gentler than the transcript's:
 * slower (420ms), barely-there travel (4px) and no pronounced scaling or
 * sideways slides — a large block moving visibly reads as mechanical.
 * `zoom` keeps the same discipline: a whisper-quiet scale with no travel.
 */
export const NEW_CHAT_MOTION_STYLES = ['reveal', 'fade', 'bloom', 'zoom'] as const

/** One new-conversation entrance style id (see {@link NEW_CHAT_MOTION_STYLES}). */
export type NewChatMotionStyle = typeof NEW_CHAT_MOTION_STYLES[number]

/** Default new-conversation style when the user-settings document has no override. */
export const DEFAULT_NEW_CHAT_MOTION_STYLE: NewChatMotionStyle = 'reveal'

/** Guard for a NewChatMotionStyle value (unknown ids fall back to the default). */
export const isNewChatMotionStyle = (value: unknown): value is NewChatMotionStyle =>
  typeof value === 'string' && (NEW_CHAT_MOTION_STYLES as readonly string[]).includes(value)

/** One sidebar entrance-motion style id (see {@link SIDEBAR_MOTION_STYLES}). */
export type SidebarMotionStyle = typeof SIDEBAR_MOTION_STYLES[number]

/** Default sidebar style when the user-settings document has no override. */
export const DEFAULT_SIDEBAR_MOTION_STYLE: SidebarMotionStyle = 'slide-left'

/** Guard for a SidebarMotionStyle value (unknown ids fall back to the default). */
export const isSidebarMotionStyle = (value: unknown): value is SidebarMotionStyle =>
  typeof value === 'string' && (SIDEBAR_MOTION_STYLES as readonly string[]).includes(value)

/**
 * One curated motion combo: a single click applies the whole configuration
 * (every toggle + every style), so a user who wants motion without tuning each
 * option can adopt a preset as-is. Presets are pure configuration bundles —
 * they are not persisted as a field; the applied values land in the ordinary
 * settings document and stay editable afterwards.
 */
export interface MotionPresetConfig {
  /** Conversation entrance-motion toggle. */
  motionEnabled: boolean
  /** Transcript entrance style. */
  motionStyle: MotionStyle
  /** Sidebar tree entrance toggle. */
  sidebarMotionEnabled: boolean
  /** Sidebar tree entrance style. */
  sidebarMotionStyle: SidebarMotionStyle
  /** Persistent selection-box toggle. */
  selectionMotionEnabled: boolean
  /** New-conversation entrance toggle. */
  newChatMotionEnabled: boolean
  /** New-conversation entrance style. */
  newChatMotionStyle: NewChatMotionStyle
  /** Settings-shell motion toggle. */
  settingsMotionEnabled: boolean
}

/** One curated motion-combo preset id (see {@link MOTION_PRESETS}). */
export type MotionPresetId = 'fluid' | 'elegant' | 'minimal'

/** One curated motion-combo preset (see {@link MOTION_PRESETS}). */
export interface MotionPreset {
  /** Stable preset id (labels live in the motion locales). */
  id: MotionPresetId
  /** The full motion configuration the preset applies. */
  config: MotionPresetConfig
}

/**
 * The three curated motion presets, in display order. Personality:
 * fluid — a lively cascade (rise-scale rows, sliding sidebar, everything on);
 * elegant — a quiet high-end feel (soft blur, plain sidebar fade, bloom);
 * minimal — barely-there fades with the selection box and settings motion off.
 */
export const MOTION_PRESETS: readonly MotionPreset[] = [
  {
    id: 'fluid',
    config: {
      motionEnabled: true,
      motionStyle: 'rise-scale',
      sidebarMotionEnabled: true,
      sidebarMotionStyle: 'slide-left',
      selectionMotionEnabled: true,
      newChatMotionEnabled: true,
      newChatMotionStyle: 'reveal',
      settingsMotionEnabled: true,
    },
  },
  {
    id: 'elegant',
    config: {
      motionEnabled: true,
      motionStyle: 'blur-in',
      sidebarMotionEnabled: true,
      sidebarMotionStyle: 'fade',
      selectionMotionEnabled: true,
      newChatMotionEnabled: true,
      newChatMotionStyle: 'bloom',
      settingsMotionEnabled: true,
    },
  },
  {
    id: 'minimal',
    config: {
      motionEnabled: true,
      motionStyle: 'fade',
      sidebarMotionEnabled: true,
      sidebarMotionStyle: 'fade',
      selectionMotionEnabled: false,
      newChatMotionEnabled: true,
      newChatMotionStyle: 'fade',
      settingsMotionEnabled: false,
    },
  },
] as const

/** Guard for a MotionPresetId value. */
export const isMotionPresetId = (value: unknown): value is MotionPresetId =>
  typeof value === 'string' && (MOTION_PRESETS as readonly MotionPreset[]).some(preset => preset.id === value)

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
   * Feature whitelist: which independently selectable features mount on the
   * web client (history / markdown / appearance / marketplace / shortcuts /
   * usage / motion). Absent or empty = every feature; present = only the
   * listed ones register. Lives in the settings namespace (the client never
   * receives the loader config), seeded from the loader config's `features`.
   */
  features?: readonly PluginFeature[]
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
