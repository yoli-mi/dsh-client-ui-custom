import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Per-message pin ("悬挂") control, rendered in the assistant message's
 * IconActions row (between copy and branch, via the
 * conversation.chat.assistant-actions slot). Pinning a turn makes its history
 * bar ignore the strip's count limit and marks it with the theme-accent
 * frame. Only renders while the history strip is enabled (historyPosition
 * ≠ 'off') — with the strip hidden there is nothing to pin to.
 */
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { DEFAULT_HISTORY_POSITION } from "../../shared.js";
import css from './PinTurnAction.module.css';
/** A location-pin glyph (filled, matches the ic_ds_* icon chrome). */
function PinIcon({ size = 16, className }) {
    return (_jsx("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z", fill: "currentColor" }) }));
}
/**
 * Render the pin toggle for one turn's assistant message.
 * @param props - owner turn/message identity + injected scope face + locale.
 */
export function PinTurnAction({ turn, sessionId, usePosition, usePinnedTurns, togglePin, t }) {
    const positionScope = usePosition(value => value);
    const position = positionScope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION;
    const pinnedScope = usePinnedTurns(value => value);
    const pinned = (pinnedScope?.value?.pinnedTurns?.[sessionId] ?? []).includes(turn);
    // The pin addresses the history strip; with the strip hidden it is a no-op.
    if (position === 'off')
        return null;
    const label = pinned ? t('pinActive') : t('pin');
    return (_jsx(Tooltip, { label: label, side: "bottom", children: _jsx("button", { type: "button", className: css.action, "aria-label": label, "aria-pressed": pinned, "data-active": pinned || undefined, onClick: () => { togglePin(turn); }, children: _jsx(PinIcon, {}) }) }));
}
//# sourceMappingURL=PinTurnAction.js.map