/**
 * General-settings row: where the floating history strip sits (left / right /
 * off). Reads/writes the ui-custom settings scope's `historyPosition`; the
 * strip's count selector (HistoryLimitRow) only appears while this is not
 * 'off'.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type HistoryPosition, type UiCustomSection } from '../../shared.ts';
/** Registration-side preference face. */
export interface HistoryPositionRowInjected {
    hooks: {
        /** The ui-custom settings scope, read for historyPosition. */
        historyPosition: SettingsScope<UiCustomSection>;
    };
    /** Change the strip's side ('left' / 'right') or hide it ('off'). */
    setHistoryPosition: (position: HistoryPosition) => void;
}
/** Full Settings-row props. */
export type HistoryPositionRowProps = PropsRuntime<'settings.general.item'> & PropsLocale<'history'> & InjectFace<HistoryPositionRowInjected>;
/**
 * Render the history bar position selector.
 * @param props - composed Settings slot props.
 */
export declare function HistoryPositionRow({ useHistoryPosition, setHistoryPosition, t }: HistoryPositionRowProps): import("react").JSX.Element;
//# sourceMappingURL=HistoryPositionRow.d.ts.map