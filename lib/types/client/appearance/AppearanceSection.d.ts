/** The 外观 settings section: theme preference (merged) + art customization form. */
import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { AppearanceInjected } from './controller.ts';
/** Props the renderer binds for the section. */
export type AppearanceSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'appearance'> & PropsRenderSlots<'settings.appearance.item'> & InjectFace<AppearanceInjected>;
/**
 * Render the appearance section content.
 * @param props - composed slot props + injected controller face.
 * @returns the section element tree.
 */
export declare function AppearanceSection({ t, useAppearance, setField, applyFontPreset, randomInspiration, resetGroup, preview, applyPreset, saveMyPreset, removeMyPreset, applyMyPreset, cancelPreview, save, resetAll, renderSlot, close, }: AppearanceSectionProps): import("react").JSX.Element;
//# sourceMappingURL=AppearanceSection.d.ts.map