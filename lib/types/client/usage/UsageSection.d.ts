/** The settings.section entry: the usage panel inline (设置 → 应用用量). */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { UsageInjected } from './contract.ts';
/** Props the renderer binds for the section. */
export type UsageSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'usage'> & InjectFace<UsageInjected>;
/**
 * Render the usage section content.
 * @param props - composed slot props + injected sessions hook.
 * @returns the section element tree.
 */
export declare function UsageSection({ t, useSessions }: UsageSectionProps): import("react").JSX.Element;
//# sourceMappingURL=UsageSection.d.ts.map