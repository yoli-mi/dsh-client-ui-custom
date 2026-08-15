/**
 * Appearance settings controller: a staged draft over the theme fields of the
 * ui-custom settings scope, projected into a snapshot store the section
 * renders. Values = the scope's resolved theme (user overrides over the
 * loader base); save writes changed fields, reset-all unsets them (reverting
 * to the loader defaults). Preview renders the draft to the document WITHOUT
 * touching the scope — the user decides after seeing the effect; cancel
 * re-applies the saved values.
 */
import { type SettingsScope, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import type { CustomThemeConfig } from '../config.ts';
import type { ThemeSection } from '../../shared.ts';
/** The theme fields the form edits. */
export type ThemeField = 'wallpaper' | 'glass' | 'accent' | 'autoAccent' | 'surfaceOpacity' | 'sidebarOpacity' | 'chatSurfaceOpacity' | 'inputOpacity' | 'codeBlockOpacity' | 'darkSurfaceOpacity' | 'gradient' | 'darkScrim' | 'fontFamily' | 'codeFontFamily' | 'fontScale' | 'scrollbarAccent' | 'vignette' | 'cornerRadius' | 'surfaceShadow' | 'focusGlow' | 'wallpaperTone' | 'darkAccent';
/** The parameter groups the appearance page shows as cards (each has a
 * "恢复本组默认" reset). */
export type ParamGroup = 'background' | 'color' | 'surface' | 'typography' | 'refine';
/** One user-saved preset ("另存为我的预设"). */
export interface MyPreset {
    id: string;
    name: string;
    config: Partial<CustomThemeConfig>;
}
/** The preset (shipped or user) the staged theme currently matches. */
export interface ActivePreset {
    kind: 'shipped' | 'my';
    id: string;
}
/** What the section renders. */
export interface AppearanceSettingsState {
    status: 'loading' | 'ready' | 'unavailable';
    writable: boolean;
    /** Effective theme values (settings over loader defaults). */
    values: ThemeSection;
    /** Staged draft the user is editing. */
    draft: ThemeSection;
    dirty: boolean;
    saving: boolean;
    /** Whether the draft is currently rendered to the document (preview mode). */
    previewing: boolean;
    /** The user's own presets (parsed from the settings document). */
    myPresets: readonly MyPreset[];
    /** The preset the staged theme matches, framed in the gallery (null = none). */
    activePreset: ActivePreset | null;
}
/** The settings-section registration face. */
export interface AppearanceInjected {
    hooks: {
        appearance: HostObservable<AppearanceSettingsState>;
    };
    setField(field: ThemeField, value: string | number | boolean): void;
    /** Load a font pairing (ui + code stacks) into the draft. */
    applyFontPreset(id: string): void;
    /** Generate a harmonious random theme from the palette algorithm. */
    randomInspiration(): void;
    /** Reset one parameter group (background / color / …) to neutral defaults. */
    resetGroup(group: ParamGroup): void;
    /** Render the staged draft to the document without saving. */
    preview(): void;
    /** Load a shipped preset into the draft and preview it immediately. */
    applyPreset(id: string): void;
    /** Save the current draft as a user preset (name shown in the gallery). */
    saveMyPreset(name: string): void;
    /** Remove one user preset. */
    removeMyPreset(id: string): void;
    /** Load a user preset into the draft and preview it immediately. */
    applyMyPreset(id: string): void;
    /** Revert the document to the saved theme (leaves the draft intact). */
    cancelPreview(): void;
    save(): void;
    resetAll(): void;
}
/** Bridges the ui-custom settings scope onto the appearance form. */
export declare class AppearanceSettingsController {
    private readonly scope;
    private readonly defaults;
    private readonly onPreview;
    readonly store: SnapshotStore<AppearanceSettingsState>;
    private values;
    private draft;
    /** Whether the user staged a field edit; the draft follows the scope until then. */
    private touched;
    private saving;
    private previewing;
    /**
     * @param scope - the bound settings scope for the ui-custom namespace.
     * @param defaults - the normalized loader config (fallback for absent fields).
     * @param onPreview - applies a merged config to the document (preview/cancel).
     */
    constructor(scope: SettingsScope<ThemeSection>, defaults: CustomThemeConfig, onPreview: (config: CustomThemeConfig) => void);
    private sync;
    private dirty;
    private publish;
    /**
     * The preset (shipped or user) whose full config the staged theme matches —
     * its card is framed in the gallery so the active theme is visible at a
     * glance. The draft is the source of truth: it mirrors the saved theme until
     * the user stages an edit, and once a preset is clicked (staged) or previewed
     * it reflects exactly the theme the user is working with / looking at.
     */
    private recomputeActivePreset;
    /** True when every theme field of the staged draft equals the preset's. */
    private matchesPreset;
    /** Render a theme section to the document via the injected applier. */
    private applyTheme;
    /** Stage one field edit (re-applies the live preview when already previewing). */
    setField(field: ThemeField, value: string | number | boolean): void;
    /** Render the staged draft to the document WITHOUT saving (the scope is untouched). */
    preview(): void;
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
    private loadPresetConfig;
    /** Load a shipped preset into the draft (staging only — the 预览 button previews). */
    applyPreset(id: string): void;
    /** Save the current draft as a user preset (name shown in the gallery). */
    saveMyPreset(name: string): Promise<void>;
    /** Remove one user preset. */
    removeMyPreset(id: string): Promise<void>;
    /** Load a user preset into the draft (staging only — the 预览 button previews). */
    applyMyPreset(id: string): void;
    /** Load a font pairing (ui + code stacks) into the draft. */
    applyFontPreset(id: string): void;
    /** Generate a harmonious random theme from the palette algorithm (staged). */
    randomInspiration(): void;
    /** Reset one parameter group to the neutral (stock) defaults. */
    resetGroup(group: ParamGroup): void;
    /** Revert the document to the saved theme (leaves the staged draft for further edits). */
    cancelPreview(): void;
    /** Restore every field to the loader defaults (unsets the user overrides). */
    resetAll(): Promise<void>;
    /** Write every changed field through the scope (live re-apply on publish). */
    save(): Promise<void>;
    /** Wire the controller: subscribe the scope and expose the form actions. */
    mount(): {
        dispose: () => void;
        actions: Pick<AppearanceInjected, 'setField' | 'applyFontPreset' | 'randomInspiration' | 'resetGroup' | 'preview' | 'applyPreset' | 'saveMyPreset' | 'removeMyPreset' | 'applyMyPreset' | 'cancelPreview' | 'save' | 'resetAll'>;
    };
}
//# sourceMappingURL=controller.d.ts.map