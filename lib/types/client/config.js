/**
 * Theme config model + normalization pipeline for the ui-custom plugin.
 *
 * The pipeline is: `DEFAULTS` ← preset (presets.ts) ← profile `config`
 * (explicit user values always win), then every field is coerced and clamped
 * into a `CustomThemeConfig` the applier can trust. Keeping normalization
 * here (pure, DOM-free) makes it unit-testable and gives GitHub users a
 * single documented contract for what each knob accepts.
 */
import { SHORTCUT_ACTIONS } from "./shortcuts.js";
/**
 * Shipped shortcut defaults. The composer gestures default to their native
 * forms (Enter sends, Shift+Enter newlines), so an unconfigured profile is
 * byte-for-byte identical to the stock composer; the plugin-only usage-panel
 * binding ships OFF so a fresh install changes nothing until the user opts in.
 */
export { SHORTCUT_ACTIONS } from "./shortcuts.js";
export const SHORTCUT_DEFAULTS = {
    newConversation: '',
    switchModel: '',
    cycleThinking: '',
    sendMessage: 'Enter',
    newline: 'Shift+Enter',
    usagePanel: '',
    defaultWorkspace: '',
    modelShortcuts: [],
};
/** Valid corner-radius values (in UI order). */
export const CORNER_RADIUS_LEVELS = ['inherit', 'sm', 'md', 'lg', 'xl'];
/** Valid surface-shadow values (in UI order). */
export const SURFACE_SHADOW_LEVELS = ['inherit', 'none', 'soft', 'medium', 'strong'];
/** Valid focus-glow values. */
export const FOCUS_GLOW_LEVELS = ['inherit', 'on'];
/** Valid wallpaper-tone values (in UI order). */
export const WALLPAPER_TONE_LEVELS = ['inherit', 'soft', 'dim', 'bright'];
const isOneOf = (value, options, fallback) => typeof value === 'string' && options.includes(value) ? value : fallback;
export const isCornerRadius = (value) => typeof value === 'string' && CORNER_RADIUS_LEVELS.includes(value);
export const isSurfaceShadow = (value) => typeof value === 'string' && SURFACE_SHADOW_LEVELS.includes(value);
export const isFocusGlow = (value) => typeof value === 'string' && FOCUS_GLOW_LEVELS.includes(value);
export const isWallpaperTone = (value) => typeof value === 'string' && WALLPAPER_TONE_LEVELS.includes(value);
/** Blur radius + saturation per glass level (mica ≈ subtle static tint, frosted ≈ strong acrylic). */
export const GLASS_LEVELS = {
    off: { blur: 0, saturate: 1 },
    light: { blur: 6, saturate: 1.15 },
    frosted: { blur: 14, saturate: 1.25 },
    mica: { blur: 22, saturate: 1.1 },
};
const isGlassLevel = (value) => typeof value === 'string' && Object.hasOwn(GLASS_LEVELS, value);
/**
 * Resolve the effective blur radius: an explicitly set `wallpaperBlur` always
 * wins; otherwise the glass level's default blur applies. The saturation
 * factor always comes from the level.
 * @param raw - the user's raw config (explicitness is judged against it).
 * @returns the effective { blur, saturate } pair.
 */
export function resolveGlass(raw) {
    const level = isGlassLevel(raw?.glass) ? raw.glass : DEFAULTS.glass;
    const base = GLASS_LEVELS[level];
    const explicit = typeof raw?.wallpaperBlur === 'number'
        ? clampNumber(raw.wallpaperBlur, 0, 60, base.blur)
        : base.blur;
    return { blur: explicit, saturate: base.saturate };
}
/**
 * Shipped defaults: deliberately neutral — no wallpaper, stock blue accent,
 * opaque surfaces. Out of the box the plugin changes nothing; users compose
 * their own look with a preset and/or explicit fields in their profile row.
 */
export const DEFAULTS = {
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
};
/** Clamp a number into [lo, hi], falling back when absent/non-finite. */
export const clampNumber = (value, lo, hi, fallback) => {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    return Math.min(hi, Math.max(lo, n));
};
/** Trim a string, returning the fallback when empty/non-string. */
export const cleanString = (value, fallback) => typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
const toBoolean = (value, fallback) => typeof value === 'boolean' ? value : fallback;
const toPercent = (value, fallback) => clampNumber(value, 0, 100, fallback);
const toVars = (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return {};
    const out = {};
    for (const [key, raw] of Object.entries(value)) {
        if (typeof raw === 'string' || typeof raw === 'number')
            out[key] = String(raw);
    }
    return out;
};
/** Coerce a shortcuts config: unknown entries dropped, strings trimmed, missing → defaults. */
export function normalizeShortcuts(value) {
    const raw = (typeof value === 'object' && value !== null ? value : {});
    const out = { ...SHORTCUT_DEFAULTS };
    for (const action of SHORTCUT_ACTIONS) {
        out[action] = typeof raw[action] === 'string' ? raw[action].trim() : out[action];
    }
    out.defaultWorkspace = typeof raw.defaultWorkspace === 'string' ? raw.defaultWorkspace.trim() : '';
    const modelShortcuts = Array.isArray(raw.modelShortcuts) ? raw.modelShortcuts : [];
    out.modelShortcuts = modelShortcuts
        .filter((entry) => typeof entry === 'object' && entry !== null
        && typeof entry.combo === 'string' && typeof entry.provider === 'string' && typeof entry.model === 'string')
        .map(entry => ({
        combo: entry.combo.trim(),
        provider: entry.provider.trim(),
        model: entry.model.trim(),
    }))
        .filter(entry => entry.combo !== '' && entry.provider !== '' && entry.model !== '');
    return out;
}
/**
 * Merge DEFAULTS ← preset ← explicit config, then coerce/clamp every field.
 * Pure: no DOM access, fully unit-testable.
 * @param raw - profile-level plugin config (may be partial / malformed).
 * @param preset - resolved preset partial (undefined when no preset matched).
 * @returns a normalized config ready for the applier.
 */
export function normalizeConfig(raw, preset) {
    const merged = { ...DEFAULTS, ...preset, ...raw };
    const surfaceOpacity = toPercent(merged.surfaceOpacity, DEFAULTS.surfaceOpacity);
    // darkSurfaceOpacity is derived: explicit (raw/preset) value, else surfaceOpacity.
    const darkSurfaceOpacity = merged.darkSurfaceOpacity === undefined
        ? surfaceOpacity
        : toPercent(merged.darkSurfaceOpacity, surfaceOpacity);
    const glass = isGlassLevel(merged.glass) ? merged.glass : DEFAULTS.glass;
    const { blur } = resolveGlass(raw);
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
    };
}
/** All supported knob names (drives docs and future settings UI). */
export const CONFIG_KEYS = [
    'preset', 'wallpaper', 'wallpaperBlur', 'glass', 'accent', 'autoAccent',
    'surfaceOpacity', 'sidebarOpacity', 'chatSurfaceOpacity', 'inputOpacity',
    'codeBlockOpacity', 'darkSurfaceOpacity', 'gradient', 'darkScrim',
    'fontFamily', 'codeFontFamily', 'fontScale', 'scrollbarAccent', 'vignette', 'cornerRadius', 'surfaceShadow',
    'focusGlow', 'wallpaperTone', 'darkAccent', 'customCss', 'customVars',
    'shortcuts',
];
//# sourceMappingURL=config.js.map