/**
 * The conversation-blended history strip. Mounted in the (always-mounted,
 * zero-width when closed) details column, but renders `position: fixed`
 * floating content over the conversation's edge — so it reads as part
 * of the body, with no separate panel or column. Session-scoped, so it reads
 * the conversation through the reliable `useSession` hook.
 *
 * Side is a settings choice. The two sides mirror each other: bars align to
 * the strip's outer edge and grow inward on hover (peak/wave), and the
 * tooltip sits on the strip's inner side. The right strip anchors to the
 * conversation's right edge (the viewport's, details closed); the left strip
 * anchors to its left edge — the rendered sidebar width, measured from the
 * AppFrame grid so a dragged or collapsed sidebar re-anchors it live.
 *
 * Idle bars are small and equal; hovering one stretches it and tapers the
 * neighbours into a peak/wave silhouette with the appearance accent. Clicking
 * a bar jumps to that turn. The mounted window pages backwards until the
 * strip has enough turns — the recent-turns limit, or the visual fill cap
 * for "all": beyond ~MAX_STRIP_TURNS the bars are sub-pixel and not
 * individually clickable, so the pager stops there instead of loading the
 * whole conversation on open (the startup-jank source). Empty sessions render
 * nothing.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type UiCustomSection } from '../../shared.ts';
/** Injected face of the details registration (close + the window pager). */
export interface HistoryStripInjected {
    /** Page the mounted window backwards one batch (older-messages pagination). */
    loadOlder: () => void;
    /** The owning session id (pins are stored per session). */
    sessionId: string;
    /** The ui-custom settings scope, read for the strip preferences. */
    hooks: {
        historyLimit: SettingsScope<UiCustomSection>;
        historyPosition: SettingsScope<UiCustomSection>;
        pinnedTurns: SettingsScope<UiCustomSection>;
    };
}
/** Full props composed by the framework for the details slot + this entry. */
export type HistoryStripProps = PropsRuntime<'details'> & PropsLocale<'history'> & InjectFace<HistoryStripInjected>;
/**
 * Render the wave history strip for the current session.
 * @param props - framework session hooks + injected close/pager actions + locale.
 */
export declare function HistoryStrip({ useSession, loadOlder, sessionId, useHistoryLimit, useHistoryPosition, usePinnedTurns, t }: HistoryStripProps): import("react").JSX.Element | null;
//# sourceMappingURL=HistoryStrip.d.ts.map