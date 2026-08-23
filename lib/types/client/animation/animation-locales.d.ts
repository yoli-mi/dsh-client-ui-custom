/** Locale dictionaries for the motion surface (the 动效 settings section). */
/** Dictionary namespace owned by the motion surface. */
export declare const ANIM_NS = "animation";
/** All motion copy keys. */
export type AnimationKey = 'nav' | 'title' | 'intro' | 'enabled' | 'enabledDesc' | 'style' | 'styleDesc' | 'style.soft' | 'style.standard' | 'style.lively' | 'style.softDesc' | 'style.standardDesc' | 'style.livelyDesc' | 'preset' | 'presetDesc' | 'preset.balanced' | 'preset.focus' | 'preset.balancedDesc' | 'preset.focusDesc';
/** Simplified Chinese copy. */
export declare const zh: Record<AnimationKey, string>;
/** English copy. */
export declare const en: Record<AnimationKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The motion section copy. */
        animation: AnimationKey;
    }
}
//# sourceMappingURL=animation-locales.d.ts.map