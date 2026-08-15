/** The settings.section entry: the usage panel inline (设置 → 应用用量). */

import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { UsageInjected } from './contract.ts'
import { UsagePanel } from './UsagePanel.tsx'

/** Props the renderer binds for the section. */
export type UsageSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'usage'>
  & InjectFace<UsageInjected>

/**
 * Render the usage section content.
 * @param props - composed slot props + injected sessions hook.
 * @returns the section element tree.
 */
export function UsageSection({ t, useSessions }: UsageSectionProps) {
  return <UsagePanel useSessions={useSessions} t={t as TranslateNS<'usage'>} />
}
