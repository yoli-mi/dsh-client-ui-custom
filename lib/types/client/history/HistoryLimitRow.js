import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * General-settings row: how many recent turns the history strip shows.
 * Reads/writes the ui-custom settings scope's `historyLimit` (0 = all).
 */
import { useState } from 'react';
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { DEFAULT_HISTORY_LIMIT, DEFAULT_HISTORY_POSITION } from "../../shared.js";
import css from './HistoryLimitRow.module.css';
/** The selectable limits: 0 is the "all" sentinel. */
const OPTIONS = [
    { id: 5, label: 'limit5' },
    { id: 10, label: 'limit10' },
    { id: 20, label: 'limit20' },
    { id: 0, label: 'limitAll' },
];
/**
 * Render the history bar count selector. Hidden entirely while the strip is
 * turned off (historyPosition = 'off'); the hooks above stay ordered before
 * the conditional return.
 * @param props - composed Settings slot props.
 */
export function HistoryLimitRow({ useHistoryLimit, setHistoryLimit, t }) {
    const scope = useHistoryLimit(value => value);
    const [open, setOpen] = useState(false);
    // The count selector only applies while the strip is visible.
    const position = scope?.value?.historyPosition ?? DEFAULT_HISTORY_POSITION;
    if (position === 'off')
        return null;
    const limit = scope?.value?.historyLimit ?? DEFAULT_HISTORY_LIMIT;
    const translator = t;
    const selectedLabel = (OPTIONS.find(option => option.id === limit) ?? OPTIONS[OPTIONS.length - 1]).label;
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('limitTitle') }), _jsx("div", { className: css.desc, children: translator('limitDesc') })] }), _jsx(Menu, { open: open, onClose: () => { setOpen(false); }, items: OPTIONS.map(option => ({ id: String(option.id), label: translator(option.label) })), selectedId: String(limit), onSelect: (id) => {
                    setOpen(false);
                    setHistoryLimit(Number(id));
                }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, "aria-haspopup": "menu", "aria-expanded": open, onClick: () => { setOpen(value => !value); }, children: [translator(selectedLabel), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) })] }));
}
//# sourceMappingURL=HistoryLimitRow.js.map