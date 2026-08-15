/** App-usage panel: model filter, time-range tabs, KPI cards, a bar trend, and top sessions. */
import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client';
/** Props shared by the settings section and the overlay panel. */
export interface UsagePanelProps {
    /** Bound hook over the sessions list (rendered by the renderer). */
    useSessions: SnapshotSelectorHook<SessionListState>;
    /** Bound translator for the usage namespace. */
    t: TranslateNS<'usage'>;
}
/**
 * Render the usage panel content.
 * @param props - sessions hook + translator.
 * @returns the panel element tree.
 */
export declare function UsagePanel({ useSessions, t }: UsagePanelProps): import("react").JSX.Element;
//# sourceMappingURL=UsagePanel.d.ts.map