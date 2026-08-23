/**
 * The "动效" settings section: the conversation entrance-motion toggle plus
 * the entrance-style selector. Reads/writes the ui-custom settings scope's
 * `motionEnabled` / `motionStyle`; the motion engine (motion.ts) gates on
 * these.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type MotionPresetId, type MotionStyle, type NewChatMotionStyle, type SidebarMotionStyle, type UiCustomSection } from '../../shared.ts';
/** Registration-side preference face. */
export interface MotionSectionInjected {
    hooks: {
        /** The ui-custom settings scope, read for motionEnabled / motionStyle. */
        motion: SettingsScope<UiCustomSection>;
    };
    /** Toggle the conversation entrance motion. */
    setMotionEnabled: (enabled: boolean) => void;
    /** Change the entrance style fresh messages use. */
    setMotionStyle: (style: MotionStyle) => void;
    /** Toggle the sidebar motion (tree entrance + group expand). */
    setSidebarMotionEnabled: (enabled: boolean) => void;
    /** Change the entrance style fresh sidebar tree items use. */
    setSidebarMotionStyle: (style: SidebarMotionStyle) => void;
    /** Toggle the persistent selection-box trace. */
    setSelectionMotionEnabled: (enabled: boolean) => void;
    /** Toggle the new-conversation (blank-session) entrance. */
    setNewChatMotionEnabled: (enabled: boolean) => void;
    /** Change the entrance style the new-conversation dialog uses. */
    setNewChatMotionStyle: (style: NewChatMotionStyle) => void;
    /** Toggle the settings-shell motion (dialog expansion, nav highlight, page switch). */
    setSettingsMotionEnabled: (enabled: boolean) => void;
    /** Apply one curated motion preset (every toggle + every style at once). */
    applyMotionPreset: (preset: MotionPresetId) => void;
}
/** Full Settings-section props. */
export type MotionSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'motion'> & InjectFace<MotionSectionInjected>;
/**
 * Render the motion settings section content.
 * @param props - composed Settings slot props.
 */
export declare function MotionSection({ useMotion, setMotionEnabled, setMotionStyle, setSidebarMotionEnabled, setSidebarMotionStyle, setSelectionMotionEnabled, setNewChatMotionEnabled, setNewChatMotionStyle, setSettingsMotionEnabled, applyMotionPreset, t, }: MotionSectionProps): import("react").JSX.Element;
//# sourceMappingURL=MotionSection.d.ts.map