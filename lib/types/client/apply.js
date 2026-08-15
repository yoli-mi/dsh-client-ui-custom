import { clampNumber, cleanString, DEFAULTS, GLASS_LEVELS } from "./config.js";
import { dominantColorFromRgba } from "./color.js";
const CUSTOM_STYLE_ID = 'dsh-ui-custom-css';
/** Corner radius px per level ('inherit' is handled by the caller). */
const CORNER_RADIUS_PX = { sm: 6, md: 10, lg: 14, xl: 18 };
/** Box-shadow string per surface-shadow level ('inherit' is handled by the caller). */
const SURFACE_SHADOW_CSS = {
    none: 'none',
    soft: '0 8px 24px rgb(0 0 0 / 0.10)',
    medium: '0 14px 36px rgb(0 0 0 / 0.16)',
    strong: '0 24px 56px rgb(0 0 0 / 0.26)',
};
/** Tone-overlay layer per wallpaper-tone level ('inherit' is handled by the
 * caller). Must be a valid `background-image` layer — a solid gradient, since
 * a bare color would invalidate the whole background-image declaration. */
const WALLPAPER_TONE_CSS = {
    soft: 'linear-gradient(rgb(15 17 21 / 0.16), rgb(15 17 21 / 0.16))',
    dim: 'linear-gradient(rgb(15 17 21 / 0.34), rgb(15 17 21 / 0.34))',
    bright: 'linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.12))',
};
/** Escapes a wallpaper string for embedding inside `url("…")`. */
const escapeUrl = (text) => text.replaceAll('"', '\\"');
/**
 * Load the wallpaper into an offscreen canvas and extract its dominant
 * saturated color (Material-You style). Resolves null on any failure —
 * CORS-tainted canvases, decode errors, missing 2D context.
 * @param url - the wallpaper URL.
 * @returns '#rrggbb' or null.
 */
export async function extractWallpaperAccent(url) {
    try {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('wallpaper decode failed'));
            image.src = url;
        });
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context === null)
            return null;
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        return dominantColorFromRgba(pixels);
    }
    catch {
        return null;
    }
}
/**
 * True when the normalized config overrides nothing — the exact stock look.
 * The applier drops the theme gate then, so an unconfigured profile is
 * byte-for-byte identical to the stock UI (the "zero changes out of the box"
 * contract). Every knob the user turns (including a gradient-only theme with
 * no wallpaper) makes the config non-neutral and activates the theme.
 * Derived from DEFAULTS so a default-value change can never silently flip the
 * gate; darkSurfaceOpacity derives from surfaceOpacity, so 100 is the neutral.
 */
const isNeutralConfig = (config) => config.wallpaper === DEFAULTS.wallpaper
    && config.gradient === DEFAULTS.gradient
    && config.accent === DEFAULTS.accent
    && config.autoAccent === DEFAULTS.autoAccent
    && config.glass === DEFAULTS.glass
    && config.surfaceOpacity === DEFAULTS.surfaceOpacity
    && config.sidebarOpacity === DEFAULTS.sidebarOpacity
    && config.chatSurfaceOpacity === DEFAULTS.chatSurfaceOpacity
    && config.inputOpacity === DEFAULTS.inputOpacity
    && config.codeBlockOpacity === DEFAULTS.codeBlockOpacity
    && config.darkSurfaceOpacity === 100
    && config.darkScrim === DEFAULTS.darkScrim
    && config.fontFamily === DEFAULTS.fontFamily
    && config.codeFontFamily === DEFAULTS.codeFontFamily
    && config.fontScale === DEFAULTS.fontScale
    && config.scrollbarAccent === DEFAULTS.scrollbarAccent
    && config.vignette === DEFAULTS.vignette
    && config.cornerRadius === DEFAULTS.cornerRadius
    && config.surfaceShadow === DEFAULTS.surfaceShadow
    && config.focusGlow === DEFAULTS.focusGlow
    && config.wallpaperTone === DEFAULTS.wallpaperTone
    && config.darkAccent === DEFAULTS.darkAccent
    && config.customCss === DEFAULTS.customCss
    && Object.keys(config.customVars).length === 0;
/**
 * Apply the normalized config to the document.
 * @param config - normalized config from normalizeConfig().
 */
export function applyConfig(config) {
    const root = document.documentElement;
    if (isNeutralConfig(config)) {
        // Nothing to override: drop the gate so every override disappears.
        root.removeAttribute('data-dsu-active');
        document.getElementById(CUSTOM_STYLE_ID)?.remove();
        return;
    }
    root.setAttribute('data-dsu-active', '1');
    const set = (name, value) => root.style.setProperty(name, value);
    const wallpaper = cleanString(config.wallpaper, '');
    if (wallpaper === '')
        root.style.removeProperty('--dsu-wallpaper');
    else
        set('--dsu-wallpaper', `url("${escapeUrl(wallpaper)}")`);
    set('--dsu-blur', `${clampNumber(config.wallpaperBlur, 0, 60, 14)}px`);
    set('--dsu-saturate', String(GLASS_LEVELS[config.glass]?.saturate ?? 1.25));
    set('--dsu-accent', cleanString(config.accent, '#4176e6'));
    set('--dsu-surface-alpha', `${clampNumber(config.surfaceOpacity, 0, 100, 50)}%`);
    set('--dsu-sidebar-alpha', `${clampNumber(config.sidebarOpacity, 0, 100, 50)}%`);
    set('--dsu-chat-alpha', `${clampNumber(config.chatSurfaceOpacity, 0, 100, 80)}%`);
    set('--dsu-input-alpha', `${clampNumber(config.inputOpacity, 0, 100, 82)}%`);
    set('--dsu-code-alpha', `${clampNumber(config.codeBlockOpacity, 0, 100, 45)}%`);
    set('--dsu-dark-alpha', `${clampNumber(config.darkSurfaceOpacity, 0, 100, config.surfaceOpacity)}%`);
    set('--dsu-scrim', `rgb(15 17 21 / ${clampNumber(config.darkScrim, 0, 100, 22) / 100})`);
    set('--dsu-gradient', config.gradient !== '' ? config.gradient : 'none');
    const font = cleanString(config.fontFamily, '');
    if (font !== '')
        set('--dsu-font', font);
    else
        root.style.removeProperty('--dsu-font');
    const codeFont = cleanString(config.codeFontFamily, '');
    if (codeFont !== '')
        set('--dsu-code-font', codeFont);
    else
        root.style.removeProperty('--dsu-code-font');
    // Whole-UI font scale: only written when it differs from 1 (the stylesheet
    // falls back to zoom: 1 = stock size).
    if (config.fontScale !== 1)
        set('--dsu-font-scale', `${clampNumber(config.fontScale, 0.9, 1.1, 1)}`);
    else
        root.style.removeProperty('--dsu-font-scale');
    set('--dsu-scrollbar', config.scrollbarAccent ? '1' : '0');
    set('--dsu-vignette', config.vignette ? '1' : '0');
    // Opt-in refinement knobs: only written when the user picks a non-neutral
    // value; 'inherit' / '' removes the property so the stylesheet falls back to
    // the stock look (the plugin changes nothing out of the box).
    if (config.cornerRadius !== 'inherit')
        set('--dsu-radius', `${CORNER_RADIUS_PX[config.cornerRadius] ?? 10}px`);
    else
        root.style.removeProperty('--dsu-radius');
    if (config.surfaceShadow !== 'inherit')
        set('--dsu-shadow', SURFACE_SHADOW_CSS[config.surfaceShadow] ?? 'none');
    else
        root.style.removeProperty('--dsu-shadow');
    set('--dsu-focus-glow', config.focusGlow === 'on' ? '1' : '0');
    if (config.wallpaperTone !== 'inherit')
        set('--dsu-tone', WALLPAPER_TONE_CSS[config.wallpaperTone] ?? 'none');
    else
        root.style.removeProperty('--dsu-tone');
    const darkAccent = cleanString(config.darkAccent, '');
    if (darkAccent !== '')
        set('--dsu-dark-accent', darkAccent);
    else
        root.style.removeProperty('--dsu-dark-accent');
    // autoAccent: derive the accent from the wallpaper (fire-and-forget; the
    // stylesheet's ramp reads --dsu-accent, so one property updates everything).
    // No wallpaper → nothing to sample, keep the explicit accent.
    if (config.autoAccent && wallpaper !== '') {
        void extractWallpaperAccent(wallpaper).then((color) => {
            if (color !== null)
                root.style.setProperty('--dsu-accent', color);
        });
    }
    // customVars: write each entry ('' removes the property).
    for (const [key, value] of Object.entries(config.customVars)) {
        if (value === '')
            root.style.removeProperty(key);
        else
            root.style.setProperty(key, value);
    }
    // customCss: a single plugin-owned style tag, kept in sync.
    let style = document.getElementById(CUSTOM_STYLE_ID);
    if (config.customCss !== '') {
        if (style === null) {
            style = document.createElement('style');
            style.id = CUSTOM_STYLE_ID;
            style.dataset.plugin = 'dsh-client-ui-custom';
            document.head.appendChild(style);
        }
        style.textContent = config.customCss;
    }
    else {
        style?.remove();
    }
}
//# sourceMappingURL=apply.js.map