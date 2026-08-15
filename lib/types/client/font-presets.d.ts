/**
 * Font-pairing presets: an interface (UI) font + a monospace code font as one
 * named pairing, each with a CJK-friendly stack. The stacks are *suggestions* —
 * they list the preferred faces first and fall back through the system stack,
 * so a face the user's machine does not have simply skips (the browser walks
 * the list). Picking a preset writes both stacks into `fontFamily` +
 * `codeFontFamily`; the 排版 group can still fine-tune each field afterwards.
 */
import type { CustomThemeConfig } from './config.ts';
/** One named font pairing. */
export interface FontPreset {
    /** Stable id ('default' = leave the theme fonts untouched). */
    id: string;
    /** Short display name. */
    name: string;
    /** One-line description. */
    description: string;
    /** Interface font stack ('default' uses '' = keep the stock stack). */
    uiFont: string;
    /** Code-font stack ('default' uses '' = keep the stock stack). */
    codeFont: string;
}
/** All shipped font pairings, in display order. */
export declare const FONT_PRESETS: readonly FontPreset[];
/** Id → font-preset lookup. */
export declare const FONT_PRESET_MAP: ReadonlyMap<string, FontPreset>;
/**
 * Resolve a font pairing to its theme fields.
 * @param id - preset id ('' / unknown / 'default' resolve to the neutral pair).
 * @returns the partial config fields for `fontFamily` / `codeFontFamily`.
 */
export declare function resolveFontPreset(id: string | undefined): Partial<CustomThemeConfig>;
//# sourceMappingURL=font-presets.d.ts.map