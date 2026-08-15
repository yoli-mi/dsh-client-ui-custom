/**
 * Applier: turns a normalized `CustomThemeConfig` into DOM effects.
 *
 * - Writes `--dsu-*` custom properties on <html> (consumed by
 *   custom.module.css).
 * - Injects a `<style id="dsu-custom">` with the user's `customCss` escape
 *   hatch (kept in sync on re-apply).
 * - Writes `customVars` as extra custom properties.
 *
 * The whole override set is gated behind `html[data-dsu-active]` in the
 * stylesheet; the gate is only removed when the config is fully neutral (the
 * stock look — no wallpaper, no gradient, stock accent, opaque surfaces), so
 * a pure gradient theme with no wallpaper still activates.
 */
import type { CustomThemeConfig } from './config.ts';
/**
 * Load the wallpaper into an offscreen canvas and extract its dominant
 * saturated color (Material-You style). Resolves null on any failure —
 * CORS-tainted canvases, decode errors, missing 2D context.
 * @param url - the wallpaper URL.
 * @returns '#rrggbb' or null.
 */
export declare function extractWallpaperAccent(url: string): Promise<string | null>;
/**
 * Apply the normalized config to the document.
 * @param config - normalized config from normalizeConfig().
 */
export declare function applyConfig(config: CustomThemeConfig): void;
//# sourceMappingURL=apply.d.ts.map