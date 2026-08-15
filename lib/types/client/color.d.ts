/**
 * Pure color math for the wallpaper auto-accent feature (Material-You style).
 * DOM-free so it is unit-testable: feed it RGBA pixel data, get a hex color.
 *
 * Strategy: bucket pixels by hue, ignore washed-out samples (near-white,
 * near-black, low saturation), score each bucket by saturation-weighted
 * population, and average the winning bucket's RGB into a hex color.
 */
/** Format an RGB triple as '#rrggbb'. */
export declare const rgbToHex: (r: number, g: number, b: number) => string;
/**
 * Derive a harmonious accent palette from one hex color (Material-You style):
 * the base, two analogous neighbors, the complementary, two triadic partners,
 * and one darkened tint — seven swatches the appearance page offers as
 * one-click accent alternatives. Pure and DOM-free.
 * @param hex - a '#rrggbb' accent color.
 * @returns '#rrggbb' swatches (the base first); an invalid hex yields [].
 */ export declare function harmonySwatches(hex: string): string[];
/**
 * Extract the dominant saturated color from RGBA pixel data (as produced by
 * canvas getImageData). Returns null when no usable color is found.
 * @param data - RGBA byte quadruples.
 * @returns '#rrggbb' or null.
 */
export declare function dominantColorFromRgba(data: Uint8ClampedArray): string | null;
/**
 * Generate one harmonious "random inspiration" theme from the color palette
 * algorithm: a muted accent sampled from a curated hue pool, a gradient built
 * from the accent + its analogous neighbor + a neutral end, and a coherent
 * glass/opacity/scrim recipe. Pure and DOM-free; the RNG is injectable so the
 * output is deterministic in tests.
 * @param rng - random source (default Math.random).
 * @returns a partial theme config (wallpaper cleared; fonts untouched).
 */
export declare function randomInspirationConfig(rng?: () => number): Partial<import('./config.ts').CustomThemeConfig>;
//# sourceMappingURL=color.d.ts.map