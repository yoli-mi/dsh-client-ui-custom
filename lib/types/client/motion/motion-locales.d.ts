/** Copy for the 动效 (Motion) settings section. */
/** Dictionary namespace owned by the motion surface. */
export declare const MOTION_NS = "motion";
/** All motion section copy keys. */
export type MotionKey = 'nav' | 'title' | 'intro' | 'presetTitle' | 'presetDesc' | 'presetFluid' | 'presetFluidDesc' | 'presetElegant' | 'presetElegantDesc' | 'presetMinimal' | 'presetMinimalDesc' | 'toggleTitle' | 'toggleDesc' | 'styleTitle' | 'styleDesc' | 'styleFadeUp' | 'styleFade' | 'styleRiseScale' | 'styleSlideIn' | 'styleBlurIn' | 'styleScaleIn' | 'sidebarStyleTitle' | 'sidebarStyleDesc' | 'styleSlideLeft' | 'styleExpand' | 'styleSlideDown' | 'sidebarToggleTitle' | 'sidebarToggleDesc' | 'selectionToggleTitle' | 'selectionToggleDesc' | 'newChatToggleTitle' | 'newChatToggleDesc' | 'newChatStyleTitle' | 'newChatStyleDesc' | 'styleReveal' | 'styleBloom' | 'styleZoom' | 'settingsToggleTitle' | 'settingsToggleDesc';
/** Simplified Chinese copy. */
export declare const zh: Record<MotionKey, string>;
/** English copy. */
export declare const en: Record<MotionKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The motion settings-section copy. */
        motion: MotionKey;
    }
}
//# sourceMappingURL=motion-locales.d.ts.map