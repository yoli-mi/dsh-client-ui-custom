import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
/** The preview hint's registration face. */
export interface PreviewBarInjected {
    hooks: {
        previewVisible: HostObservable<boolean>;
    };
    /** Exit preview mode and reopen the settings page. */
    onExit(): void;
}
/** Props the renderer binds for the hint. */
export type PreviewBarProps = PropsRuntime<'shell.overlay'> & PropsLocale<'appearance'> & InjectFace<PreviewBarInjected>;
/**
 * Render the clean preview hint (null while not previewing).
 * @param props - composed slot props + injected exit action.
 * @returns the hint element tree, or null.
 */
export declare function PreviewBar({ t, usePreviewVisible, onExit }: PreviewBarProps): import("react").JSX.Element | null;
//# sourceMappingURL=PreviewBar.d.ts.map