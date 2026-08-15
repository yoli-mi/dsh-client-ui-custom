/**
 * Appearance settings controller: a staged draft over the theme fields of the
 * ui-custom settings scope, projected into a snapshot store the section
 * renders. Values = the scope's resolved theme (user overrides over the
 * loader base); save writes changed fields, reset-all unsets them (reverting
 * to the loader defaults). Preview renders the draft to the document WITHOUT
 * touching the scope — the user decides after seeing the effect; cancel
 * re-applies the saved values.
 */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import { DEFAULTS, normalizeConfig } from "../config.js";
import { PRESETS, PRESET_MAP } from "../presets.js";
import { resolveFontPreset } from "../font-presets.js";
import { randomInspirationConfig } from "../color.js";
import { previewBar } from "../preview-bar.js";
import { configFromThemeSection } from "../theme-section.js";
const THEME_FIELDS = [
    'wallpaper', 'glass', 'accent', 'autoAccent',
    'surfaceOpacity', 'sidebarOpacity', 'chatSurfaceOpacity', 'inputOpacity', 'codeBlockOpacity', 'darkSurfaceOpacity',
    'gradient', 'darkScrim', 'fontFamily', 'codeFontFamily', 'fontScale', 'scrollbarAccent', 'vignette',
    'cornerRadius', 'surfaceShadow', 'focusGlow', 'wallpaperTone', 'darkAccent',
];
/** Field list per group — drives the group reset. */
const GROUP_FIELDS = {
    background: ['wallpaper', 'glass', 'gradient', 'darkScrim', 'wallpaperTone'],
    color: ['accent', 'autoAccent', 'darkAccent'],
    surface: ['surfaceOpacity', 'sidebarOpacity', 'chatSurfaceOpacity', 'inputOpacity', 'codeBlockOpacity', 'darkSurfaceOpacity'],
    typography: ['fontFamily', 'codeFontFamily', 'fontScale'],
    refine: ['cornerRadius', 'surfaceShadow', 'focusGlow', 'scrollbarAccent', 'vignette'],
};
/** Neutral (stock-look) value per group field — what 恢复本组默认 writes. */
const GROUP_NEUTRALS = {
    background: {
        wallpaper: DEFAULTS.wallpaper, glass: DEFAULTS.glass, gradient: DEFAULTS.gradient,
        darkScrim: DEFAULTS.darkScrim, wallpaperTone: DEFAULTS.wallpaperTone,
    },
    color: { accent: DEFAULTS.accent, autoAccent: DEFAULTS.autoAccent, darkAccent: DEFAULTS.darkAccent },
    surface: {
        surfaceOpacity: DEFAULTS.surfaceOpacity, sidebarOpacity: DEFAULTS.sidebarOpacity,
        chatSurfaceOpacity: DEFAULTS.chatSurfaceOpacity, inputOpacity: DEFAULTS.inputOpacity,
        codeBlockOpacity: DEFAULTS.codeBlockOpacity, darkSurfaceOpacity: 100,
    },
    typography: { fontFamily: DEFAULTS.fontFamily, codeFontFamily: DEFAULTS.codeFontFamily, fontScale: DEFAULTS.fontScale },
    refine: {
        cornerRadius: DEFAULTS.cornerRadius, surfaceShadow: DEFAULTS.surfaceShadow, focusGlow: DEFAULTS.focusGlow,
        scrollbarAccent: DEFAULTS.scrollbarAccent, vignette: DEFAULTS.vignette,
    },
};
/** Serialize a user preset record for the settings document. */
const serializeMyPreset = (name, config) => JSON.stringify({ name, config });
/** Map a theme section to a partial config, dropping undefined fields. */
function themeSectionToPartial(section) {
    const out = {};
    for (const field of THEME_FIELDS) {
        const value = section[field];
        if (value !== undefined)
            out[field] = value;
    }
    return out;
}
/** Parse the settings document's myPresets dict into records (lenient). */
function parseMyPresets(raw) {
    if (typeof raw !== 'object' || raw === null)
        return [];
    const out = [];
    for (const [id, value] of Object.entries(raw)) {
        if (typeof value !== 'string')
            continue;
        try {
            const parsed = JSON.parse(value);
            const name = typeof parsed.name === 'string' && parsed.name !== '' ? parsed.name : id;
            if (typeof parsed.config !== 'object' || parsed.config === null)
                continue;
            out.push({ id, name, config: parsed.config });
        }
        catch {
            // malformed record — skip
        }
    }
    return out;
}
const themeOf = (config) => ({
    wallpaper: config.wallpaper,
    glass: config.glass,
    accent: config.accent,
    autoAccent: config.autoAccent,
    surfaceOpacity: config.surfaceOpacity,
    sidebarOpacity: config.sidebarOpacity,
    chatSurfaceOpacity: config.chatSurfaceOpacity,
    inputOpacity: config.inputOpacity,
    codeBlockOpacity: config.codeBlockOpacity,
    darkSurfaceOpacity: config.darkSurfaceOpacity,
    gradient: config.gradient,
    darkScrim: config.darkScrim,
    fontFamily: config.fontFamily,
    codeFontFamily: config.codeFontFamily,
    fontScale: config.fontScale,
    scrollbarAccent: config.scrollbarAccent,
    vignette: config.vignette,
    cornerRadius: config.cornerRadius,
    surfaceShadow: config.surfaceShadow,
    focusGlow: config.focusGlow,
    wallpaperTone: config.wallpaperTone,
    darkAccent: config.darkAccent,
});
/** Bridges the ui-custom settings scope onto the appearance form. */
export class AppearanceSettingsController {
    scope;
    defaults;
    onPreview;
    store;
    values;
    draft;
    /** Whether the user staged a field edit; the draft follows the scope until then. */
    touched = false;
    saving = false;
    previewing = false;
    /**
     * @param scope - the bound settings scope for the ui-custom namespace.
     * @param defaults - the normalized loader config (fallback for absent fields).
     * @param onPreview - applies a merged config to the document (preview/cancel).
     */
    constructor(scope, defaults, onPreview) {
        this.scope = scope;
        this.defaults = defaults;
        this.onPreview = onPreview;
        // Seed the draft from the scope's current resolved section (schema
        // defaults when it has not loaded yet). Seeding from `defaults` alone
        // left the form permanently "dirty" against the real document: the first
        // sync that brought real values in would refuse to adopt them into the
        // draft, so the form showed defaults and a save would overwrite the real
        // config with them.
        this.values = themeOf(configFromThemeSection(defaults, scope.getSnapshot().value));
        this.draft = { ...this.values };
        this.store = createSnapshotStore({
            status: 'loading', writable: false,
            values: this.values, draft: this.draft, dirty: false, saving: false, previewing: false, myPresets: [],
            activePreset: null,
        });
        this.sync();
    }
    sync() {
        const snapshot = this.scope.getSnapshot();
        const config = configFromThemeSection(this.defaults, snapshot.value);
        this.values = themeOf(config);
        // Follow the scope (the first load, an external document reload) until the
        // user stages an edit; an in-progress draft must not be clobbered.
        if (!this.touched)
            this.draft = { ...this.values };
        // Any external scope change re-applies the SAVED theme (index.ts
        // applyTheme); a transient preview no longer represents the document.
        this.previewing = false;
        previewBar.hide();
        const myPresets = parseMyPresets(snapshot.value?.myPresets);
        this.store.update((state) => {
            state.status = snapshot.status;
            state.writable = snapshot.writable;
            state.values = this.values;
            state.draft = this.draft;
            state.dirty = this.dirty();
            state.saving = this.saving;
            state.previewing = this.previewing;
            state.myPresets = myPresets;
            state.activePreset = this.recomputeActivePreset(myPresets);
        });
    }
    dirty() {
        return THEME_FIELDS.some((field) => this.draft[field] !== this.values[field]);
    }
    publish() {
        this.store.update((state) => {
            state.values = this.values;
            state.draft = this.draft;
            state.dirty = this.dirty();
            state.saving = this.saving;
            state.previewing = this.previewing;
            state.activePreset = this.recomputeActivePreset(state.myPresets);
        });
    }
    /**
     * The preset (shipped or user) whose full config the staged theme matches —
     * its card is framed in the gallery so the active theme is visible at a
     * glance. The draft is the source of truth: it mirrors the saved theme until
     * the user stages an edit, and once a preset is clicked (staged) or previewed
     * it reflects exactly the theme the user is working with / looking at.
     */
    recomputeActivePreset(myPresets) {
        for (const preset of PRESETS) {
            if (this.matchesPreset(preset.config))
                return { kind: 'shipped', id: preset.id };
        }
        for (const preset of myPresets) {
            if (this.matchesPreset(preset.config))
                return { kind: 'my', id: preset.id };
        }
        return null;
    }
    /** True when every theme field of the staged draft equals the preset's. */
    matchesPreset(config) {
        const presetSection = themeOf(normalizeConfig(undefined, config));
        return THEME_FIELDS.every((field) => presetSection[field] === this.draft[field]);
    }
    /** Render a theme section to the document via the injected applier. */
    applyTheme(section) {
        // configFromThemeSection layers the section over the loader defaults and
        // produces a full normalized config (undefined fields fall back), so a
        // preview never drops the non-theme knobs (preset / customCss / …).
        this.onPreview(configFromThemeSection(this.defaults, section));
    }
    /** Stage one field edit (re-applies the live preview when already previewing). */
    setField(field, value) {
        // The computed key defeats per-field narrowing; the stored draft is read
        // back through per-field accessors, so the cast is type-only.
        this.touched = true;
        this.draft = { ...this.draft, [field]: value };
        if (this.previewing)
            this.applyTheme(this.draft);
        this.publish();
    }
    /** Render the staged draft to the document WITHOUT saving (the scope is untouched). */
    preview() {
        if (!this.dirty())
            return;
        this.previewing = true;
        previewBar.show();
        this.applyTheme(this.draft);
        this.publish();
    }
    /**
     * Load a preset config into the draft — staging only, no preview. Shipped
     * presets are pure color-gradient themes and ship no wallpaper — the
     * gradient IS the background, so loading one clears the wallpaper instead
     * of letting it dilute the gradient (the saved wallpaper is untouched;
     * cancelPreview restores it, and the 壁纸 field re-adds it). The user then
     * enters the preview through the shared 预览 button, exactly like any
     * manual edit — one unified preview path.
     * @param config - the preset's partial config.
     */
    loadPresetConfig(config) {
        const presetTheme = themeOf(configFromThemeSection(this.defaults, config));
        const wallpaper = typeof config.wallpaper === 'string' && config.wallpaper !== ''
            ? config.wallpaper
            : '';
        this.touched = true;
        this.draft = { ...presetTheme, wallpaper };
        this.previewing = false;
        this.publish();
    }
    /** Load a shipped preset into the draft (staging only — the 预览 button previews). */
    applyPreset(id) {
        const preset = PRESET_MAP.get(id)?.config;
        if (preset === undefined)
            return;
        this.loadPresetConfig(preset);
    }
    /** Save the current draft as a user preset (name shown in the gallery). */
    async saveMyPreset(name) {
        const clean = name.trim();
        if (clean === '')
            return;
        const config = themeSectionToPartial(this.draft);
        const record = serializeMyPreset(clean, config);
        const current = this.scope.getSnapshot().value?.myPresets ?? {};
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        await this.scope.set('myPresets', { ...current, [id]: record });
        this.sync();
    }
    /** Remove one user preset. */
    async removeMyPreset(id) {
        const current = this.scope.getSnapshot().value?.myPresets ?? {};
        if (!(id in current))
            return;
        const next = { ...current };
        delete next[id];
        if (Object.keys(next).length === 0)
            await this.scope.unset('myPresets');
        else
            await this.scope.set('myPresets', next);
        this.sync();
    }
    /** Load a user preset into the draft (staging only — the 预览 button previews). */
    applyMyPreset(id) {
        const preset = this.store.getSnapshot().myPresets.find((entry) => entry.id === id);
        if (preset === undefined)
            return;
        this.loadPresetConfig(preset.config);
    }
    /** Load a font pairing (ui + code stacks) into the draft. */
    applyFontPreset(id) {
        const fields = resolveFontPreset(id);
        this.touched = true;
        this.draft = { ...this.draft, fontFamily: fields.fontFamily, codeFontFamily: fields.codeFontFamily };
        if (this.previewing)
            this.applyTheme(this.draft);
        this.publish();
    }
    /** Generate a harmonious random theme from the palette algorithm (staged). */
    randomInspiration() {
        this.loadPresetConfig(randomInspirationConfig());
    }
    /** Reset one parameter group to the neutral (stock) defaults. */
    resetGroup(group) {
        const neutral = GROUP_NEUTRALS[group];
        let next = this.draft;
        for (const field of GROUP_FIELDS[group]) {
            next = { ...next, [field]: neutral[field] };
        }
        this.touched = true;
        this.draft = next;
        if (this.previewing)
            this.applyTheme(this.draft);
        this.publish();
    }
    /** Revert the document to the saved theme (leaves the staged draft for further edits). */
    cancelPreview() {
        if (!this.previewing)
            return;
        this.previewing = false;
        previewBar.hide();
        this.applyTheme(this.values);
        this.publish();
    }
    /** Restore every field to the loader defaults (unsets the user overrides). */
    async resetAll() {
        if (this.saving)
            return;
        this.saving = true;
        this.publish();
        try {
            for (const field of THEME_FIELDS)
                await this.scope.unset(field);
        }
        finally {
            this.saving = false;
            this.touched = false;
            this.sync();
        }
    }
    /** Write every changed field through the scope (live re-apply on publish). */
    async save() {
        if (!this.dirty() || this.saving)
            return;
        this.saving = true;
        this.publish();
        try {
            for (const field of THEME_FIELDS) {
                const next = this.draft[field];
                if (next === this.values[field])
                    continue;
                await this.scope.set(field, next);
            }
        }
        finally {
            this.saving = false;
            this.touched = false;
            this.sync();
        }
    }
    /** Wire the controller: subscribe the scope and expose the form actions. */
    mount() {
        const dispose = this.scope.subscribe(() => this.sync());
        return {
            dispose,
            actions: {
                setField: (field, value) => this.setField(field, value),
                applyFontPreset: (id) => this.applyFontPreset(id),
                randomInspiration: () => this.randomInspiration(),
                resetGroup: (group) => this.resetGroup(group),
                preview: () => this.preview(),
                applyPreset: (id) => this.applyPreset(id),
                saveMyPreset: (name) => { void this.saveMyPreset(name); },
                removeMyPreset: (id) => { void this.removeMyPreset(id); },
                applyMyPreset: (id) => this.applyMyPreset(id),
                cancelPreview: () => this.cancelPreview(),
                save: () => { void this.save(); },
                resetAll: () => { void this.resetAll(); },
            },
        };
    }
}
//# sourceMappingURL=controller.js.map