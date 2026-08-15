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
import type { CustomThemeConfig } from './config.ts';
/** One named preset. */
export interface ThemePreset {
    /** Stable id used in config (`preset: '<id>'`). */
    id: string;
    /** Short display name. */
    name: string;
    /** One-line description (README + settings gallery). */
    description: string;
    /** Partial config overlaid on DEFAULTS. */
    config: Partial<CustomThemeConfig>;
}
/** All shipped presets, in display order. */
export declare const PRESETS: readonly ThemePreset[];
/** Id → preset lookup. */
export declare const PRESET_MAP: ReadonlyMap<string, ThemePreset>;
/**
 * Resolve a preset id to its partial config.
 * @param id - preset id ('' or unknown ids resolve to undefined).
 * @returns the preset's partial config, or undefined.
 */
export declare function resolvePreset(id: string | undefined): Partial<CustomThemeConfig> | undefined;
//# sourceMappingURL=presets.d.ts.map