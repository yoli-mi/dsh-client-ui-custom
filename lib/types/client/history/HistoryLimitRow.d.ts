/**
 * General-settings row: how many recent turns the history strip shows.
 * Reads/writes the ui-custom settings scope's `historyLimit` (0 = all).
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type UiCustomSection } from '../../shared.ts';
/** Registration-side preference face. */
export interface HistoryLimitRowInjected {
    hooks: {
        /** The ui-custom settings scope, read for historyLimit. */
        historyLimit: SettingsScope<UiCustomSection>;
    };
    /** Change the strip's recent-turns limit (0 = all). */
    setHistoryLimit: (limit: number) => void;
}
/** Full Settings-row props. */
export type HistoryLimitRowProps = PropsRuntime<'settings.general.item'> & PropsLocale<'history'> & InjectFace<HistoryLimitRowInjected>;
/**
 * Render the history bar count selector. Hidden entirely while the strip is
 * turned off (historyPosition = 'off'); the hooks above stay ordered before
 * the conditional return.
 * @param props - composed Settings slot props.
 */
export declare function HistoryLimitRow({ useHistoryLimit, setHistoryLimit, t }: HistoryLimitRowProps): import("react").JSX.Element | null;
//# sourceMappingURL=HistoryLimitRow.d.ts.map