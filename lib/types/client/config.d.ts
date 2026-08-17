import type { ModelShortcut, PluginFeature } from '../shared.ts';
/** One user-customizable keybinding (key-combo spec; '' = default behavior). */
export interface ShortcutConfig {
    /** Start a new conversation. */
    newConversation: string;
    /** Cycle to the next model in the session's catalog. */
    switchModel: string;
    /** Cycle the model's reasoning effort (off → high → max → …). */
    cycleThinking: string;
    /** Composer send gesture (native default: Enter). */
    sendMessage: string;
    /** Composer newline gesture (native default: Shift+Enter). */
    newline: string;
    /** Toggle the app-usage panel (default: Mod+Alt+U). */
    usagePanel: string;
    /** Workspace the new-conversation shortcut opens in ('' = current/recent). */
    defaultWorkspace: string;
    /** One-to-one model shortcuts: each combo jumps to its specific model. */
    modelShortcuts: ModelShortcut[];
}
/**
 * Shipped shortcut defaults. The composer gestures default to their native
 * forms (Enter sends, Shift+Enter newlines), so an unconfigured profile is
 * byte-for-byte identical to the stock composer; the plugin-only usage-panel
 * binding ships OFF so a fresh install changes nothing until the user opts in.
 */
export { SHORTCUT_ACTIONS } from './shortcuts.ts';
export declare const SHORTCUT_DEFAULTS: ShortcutConfig;
/** Every knob the plugin understands. New art options extend this interface. */
export interface CustomThemeConfig {
    /** Preset id from presets.ts ('' = none; preset fields merge under explicit config). */
    preset: string;
    /** Wallpaper URL or web-served path (empty string = plugin off). */
    wallpaper: string;
    /** Frosted-glass blur radius on the app root, px (0 disables). Resolved from `glass` unless explicitly set. */
    wallpaperBlur: number;
    /** Glass level: high-level frosted-glass choice driving blur + saturation. */
    glass: GlassLevel;
    /** Accent color; the whole deepseek ramp is derived from it. */
    accent: string;
    /** Derive the accent color automatically from the wallpaper (overrides `accent` on success). */
    autoAccent: boolean;
    /** Main surface opacity, 0–100 (chat/details columns). */
    surfaceOpacity: number;
    /** Sidebar surface opacity, 0–100. */
    sidebarOpacity: number;
    /** Chat column opacity, 0–100 (read via --dsw-chat-surface). */
    chatSurfaceOpacity: number;
    /** Composer input opacity, 0–100. */
    inputOpacity: number;
    /** Code block / inline code opacity, 0–100. */
    codeBlockOpacity: number;
    /** Dark-mode surface opacity, 0–100 (defaults to surfaceOpacity when unset). */
    darkSurfaceOpacity?: number;
    /** Light-theme tone-blend wash over the wallpaper (CSS gradient; empty = none). */
    gradient: string;
    /** Dark-theme scrim strength over the wallpaper, 0–100. */
    darkScrim: number;
    /** Interface font stack override (empty = theme default). */
    fontFamily: string;
    /** Code-font stack override (empty = theme default; pairs with fontFamily). */
    codeFontFamily: string;
    /** Whole-UI font scale, 0.9–1.1 in 0.05 steps (1 = stock size). */
    fontScale: number;
    /** Tint the scrollbar with the accent color. */
    scrollbarAccent: boolean;
    /** Soft inset vignette on the app root. */
    vignette: boolean;
    /**
     * Opt-in refinement knobs. Every knob defaults to its neutral value
     * ('inherit' / ''): the plugin changes nothing until the user picks one.
     */
    /** Corner radius: 'inherit' | 'sm' | 'md' | 'lg' | 'xl'. */
    cornerRadius: CornerRadius;
    /** Surface shadow: 'inherit' | 'none' | 'soft' | 'medium' | 'strong'. */
    surfaceShadow: SurfaceShadow;
    /** Focus glow: 'inherit' | 'on'. */
    focusGlow: FocusGlow;
    /** Wallpaper tone overlay: 'inherit' | 'soft' | 'dim' | 'bright'. */
    wallpaperTone: WallpaperTone;
    /** Dark-mode accent override ('' = inherit the main accent). */
    darkAccent: string;
    /** Raw CSS appended verbatim (escape hatch for personal tweaks). */
    customCss: string;
    /** Extra CSS custom properties written onto <html> (escape hatch). */
    customVars: Record<string, string>;
    /** User-customizable keyboard shortcuts ('' disables an action). */
    shortcuts: ShortcutConfig;
    /**
     * Feature whitelist: which independently selectable features to mount.
     * Absent or empty = every feature (backward compatible); present = only
     * the listed features register. Loader-level selection, not a theme knob.
     */
    features?: readonly PluginFeature[];
    /**
     * GitHub raw marketplace manifest URL. Read straight from the raw loader
     * config (never through normalizeConfig): the client apply() receives no
     * loader config, so this only takes effect when a caller passes it
     * directly; the remote default is used otherwise.
     */
    marketplaceUrl?: string;
}
/** Frosted-glass levels: a high-level "how translucent" choice. */
export type GlassLevel = 'off' | 'light' | 'frosted' | 'mica';
/** Opt-in corner radius (inherit = keep the stock look). */
export type CornerRadius = 'inherit' | 'sm' | 'md' | 'lg' | 'xl';
/** Opt-in surface shadow (inherit = keep the stock look). */
export type SurfaceShadow = 'inherit' | 'none' | 'soft' | 'medium' | 'strong';
/** Opt-in focus glow (inherit = stock focus, no added ring). */
export type FocusGlow = 'inherit' | 'on';
/** Opt-in wallpaper tone overlay (inherit = untouched wallpaper). */
export type WallpaperTone = 'inherit' | 'soft' | 'dim' | 'bright';
/** Valid corner-radius values (in UI order). */
export declare const CORNER_RADIUS_LEVELS: readonly CornerRadius[];
/** Valid surface-shadow values (in UI order). */
export declare const SURFACE_SHADOW_LEVELS: readonly SurfaceShadow[];
/** Valid focus-glow values. */
export declare const FOCUS_GLOW_LEVELS: readonly FocusGlow[];
/** Valid wallpaper-tone values (in UI order). */
export declare const WALLPAPER_TONE_LEVELS: readonly WallpaperTone[];
export declare const isCornerRadius: (value: unknown) => value is CornerRadius;
export declare const isSurfaceShadow: (value: unknown) => value is SurfaceShadow;
export declare const isFocusGlow: (value: unknown) => value is FocusGlow;
export declare const isWallpaperTone: (value: unknown) => value is WallpaperTone;
/** Blur radius + saturation per glass level (mica ≈ subtle static tint, frosted ≈ strong acrylic). */
export declare const GLASS_LEVELS: Readonly<Record<GlassLevel, {
    blur: number;
    saturate: number;
}>>;
/**
 * Resolve the effective blur radius: an explicitly set `wallpaperBlur` always
 * wins; otherwise the glass level's default blur applies. The saturation
 * factor always comes from the level.
 * @param raw - the user's raw config (explicitness is judged against it).
 * @returns the effective { blur, saturate } pair.
 */
export declare function resolveGlass(raw: Partial<CustomThemeConfig> | undefined): {
    blur: number;
    saturate: number;
};
/**
 * Shipped defaults: deliberately neutral — no wallpaper, stock blue accent,
 * opaque surfaces. Out of the box the plugin changes nothing; users compose
 * their own look with a preset and/or explicit fields in their profile row.
 */
export declare const DEFAULTS: CustomThemeConfig;
/** Clamp a number into [lo, hi], falling back when absent/non-finite. */
export declare const clampNumber: (value: unknown, lo: number, hi: number, fallback: number) => number;
/** Trim a string, returning the fallback when empty/non-string. */
export declare const cleanString: (value: unknown, fallback: string) => string;
/** Coerce a shortcuts config: unknown entries dropped, strings trimmed, missing → defaults. */
export declare function normalizeShortcuts(value: unknown): ShortcutConfig;
/**
 * Resolve the enabled feature set from the loader config. The `features`
 * field is a whitelist: absent or empty means every feature mounts (backward
 * compatible); present means only the listed features register. Unknown ids
 * are dropped. Pure: no DOM access, fully unit-testable.
 * @param raw - the profile-level plugin config.
 * @returns the set of features to mount.
 */
export declare function resolveFeatures(raw: {
    readonly features?: readonly PluginFeature[] | undefined;
} | undefined): Set<PluginFeature>;
/**
 * Merge DEFAULTS ← preset ← explicit config, then coerce/clamp every field.
 * Pure: no DOM access, fully unit-testable.
 * @param raw - profile-level plugin config (may be partial / malformed).
 * @param preset - resolved preset partial (undefined when no preset matched).
 * @returns a normalized config ready for the applier.
 */
export declare function normalizeConfig(raw: Partial<CustomThemeConfig> | undefined, preset: Partial<CustomThemeConfig> | undefined): CustomThemeConfig;
/** All supported knob names (drives docs and future settings UI). */
export declare const CONFIG_KEYS: readonly (keyof CustomThemeConfig)[];
//# sourceMappingURL=config.d.ts.map