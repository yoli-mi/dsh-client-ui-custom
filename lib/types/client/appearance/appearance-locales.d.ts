/** Locale dictionaries for the appearance settings section (主题定制 + 外观偏好). */
/** Dictionary namespace owned by the appearance surface. */
export declare const APPEARANCE_NS = "appearance";
/** All appearance copy keys. */
export type AppearanceKey = 'nav' | 'title' | 'intro' | 'save' | 'saving' | 'reset' | 'dirty' | 'unavailable' | 'unavailableHint' | 'preview' | 'previewing' | 'cancelPreview' | 'wallpaper' | 'wallpaperHint' | 'glass' | 'glass.off' | 'glass.light' | 'glass.frosted' | 'glass.mica' | 'accent' | 'accentPalette' | 'accentPaletteHint' | 'autoAccent' | 'surfaceOpacity' | 'sidebarOpacity' | 'chatSurfaceOpacity' | 'inputOpacity' | 'codeBlockOpacity' | 'darkSurfaceOpacity' | 'gradient' | 'gradientHint' | 'darkScrim' | 'fontFamily' | 'codeFontFamily' | 'fontScale' | 'fontScaleHint' | 'scrollbarAccent' | 'vignette' | 'refineTitle' | 'cornerRadius' | 'radius.inherit' | 'radius.sm' | 'radius.md' | 'radius.lg' | 'radius.xl' | 'surfaceShadow' | 'shadow.inherit' | 'shadow.none' | 'shadow.soft' | 'shadow.medium' | 'shadow.strong' | 'wallpaperTone' | 'tone.inherit' | 'tone.soft' | 'tone.dim' | 'tone.bright' | 'darkAccent' | 'darkAccentHint' | 'darkAccentPlaceholder' | 'focusGlow' | 'presetTitle' | 'presetHint' | 'myPresetName' | 'saveMyPreset' | 'removeMyPreset' | 'activePreset' | 'previewTitle' | 'previewHint' | 'randomInspiration' | 'groupBackground' | 'groupColor' | 'groupSurface' | 'groupTypography' | 'groupReset' | 'fontPreset' | 'fontPresetHint' | 'fontCustom' | 'previewingBar';
/** Simplified Chinese copy. */
export declare const zh: Record<AppearanceKey, string>;
/** English copy. */
export declare const en: Record<AppearanceKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The appearance section copy. */
        appearance: AppearanceKey;
    }
}
//# sourceMappingURL=appearance-locales.d.ts.map