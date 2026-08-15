/** The shell.overlay entry: the usage panel popped by the shortcut (Mod+Alt+U). */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { UsageOverlayInjected } from './contract.ts';
/** Props the renderer binds for the overlay entry. */
export type UsageOverlayProps = PropsRuntime<'shell.overlay'> & PropsLocale<'usage'> & InjectFace<UsageOverlayInjected>;
/**
 * Render the usage overlay (null while hidden; Esc / backdrop / close hides it).
 * @param props - composed slot props + injected hooks.
 * @returns the overlay element tree, or null.
 */
export declare function UsageOverlay({ t, useSessions, useUsageVisible }: UsageOverlayProps): import("react").JSX.Element | null;
//# sourceMappingURL=UsageOverlay.d.ts.map