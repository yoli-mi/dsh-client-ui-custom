/**
 * The "动效" settings section: master switch, motion style tier, and a preset
 * bundle picker. Reads/writes the ui-custom settings namespace's
 * animationEnabled / animationStyle / animationPreset; the client applies
 * them to `html[data-dsu-anim]` + `--dsu-anim-*` variables reactively.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { AnimationPreset, AnimationStyle, UiCustomSection } from '../../shared.ts';
/** Registration-side face: the ui-custom scope behind the motion knobs. */
export interface AnimationInjected {
    hooks: {
        /** The ui-custom settings scope, read for animationEnabled/Style/Preset. */
        animation: SettingsScope<UiCustomSection>;
    };
    setEnabled(enabled: boolean): void;
    setStyle(style: AnimationStyle): void;
    setPreset(preset: AnimationPreset): void;
}
/** Full Settings-section props. */
export type AnimationSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'animation'> & InjectFace<AnimationInjected>;
/**
 * Render the motion section content.
 * @param props - composed slot props + injected controller face.
 */
export declare function AnimationSection({ t, useAnimation, setEnabled, setStyle, setPreset, }: AnimationSectionProps): import("react").JSX.Element;
//# sourceMappingURL=AnimationSection.d.ts.map