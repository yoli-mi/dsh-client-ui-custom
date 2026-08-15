import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * General-settings row: where the floating history strip sits (left / right /
 * off). Reads/writes the ui-custom settings scope's `historyPosition`; the
 * strip's count selector (HistoryLimitRow) only appears while this is not
 * 'off'.
 */
import { useState } from 'react';
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { DEFAULT_HISTORY_POSITION, HISTORY_POSITIONS, } from "../../shared.js";
import css from './HistoryPositionRow.module.css';
/** The selectable sides, in display order (the default is the middle one). */
const OPTIONS = [
    { id: 'left', label: 'positionLeft' },
    { id: 'right', label: 'positionRight' },
    { id: 'off', label: 'positionOff' },
];
/**
 * Render the history bar position selector.
 * @param props - composed Settings slot props.
 */
export function HistoryPositionRow({ useHistoryPosition, setHistoryPosition, t }) {
    const scope = useHistoryPosition(value => value);
    const [open, setOpen] = useState(false);
    const position = scope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION;
    const translator = t;
    const selectedLabel = (OPTIONS.find(option => option.id === position) ?? OPTIONS[1]).label;
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('positionTitle') }), _jsx("div", { className: css.desc, children: translator('positionDesc') })] }), _jsx(Menu, { open: open, onClose: () => { setOpen(false); }, items: OPTIONS.map(option => ({ id: option.id, label: translator(option.label) })), selectedId: position, onSelect: (id) => {
                    setOpen(false);
                    // Guard the Menu's free-form id before it lands in the settings doc.
                    if (HISTORY_POSITIONS.includes(id))
                        setHistoryPosition(id);
                }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, "aria-haspopup": "menu", "aria-expanded": open, onClick: () => { setOpen(value => !value); }, children: [translator(selectedLabel), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) })] }));
}
//# sourceMappingURL=HistoryPositionRow.js.map