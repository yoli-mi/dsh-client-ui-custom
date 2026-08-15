/** The "快捷键" settings section: six recordable bindings, the default
 * workspace for the new-conversation shortcut, one-to-one model shortcuts,
 * and the save/reset footer. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ShortcutsSettingsInjected } from './contract.ts';
/** Props the renderer binds for the section. */
export type ShortcutsSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'shortcuts'> & InjectFace<ShortcutsSettingsInjected>;
/**
 * Render the shortcuts section content.
 * @param props - composed slot props + injected controller face.
 */
export declare function ShortcutsSection({ t, useShortcuts, useWorkspaces, useModels, setDraft, save, resetField, setDefaultWorkspace, addModelShortcut, removeModelShortcut, setModelShortcutCombo, setModelShortcutTarget, }: ShortcutsSectionProps): import("react").JSX.Element;
//# sourceMappingURL=ShortcutsSection.d.ts.map