import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** The shell.overlay entry: the usage panel popped by the shortcut (Mod+Alt+U). */
import { useEffect } from 'react';
import { usageOverlay } from "../usage-overlay.js";
import { UsagePanel } from "./UsagePanel.js";
import css from './UsageOverlay.module.css';
/**
 * Render the usage overlay (null while hidden; Esc / backdrop / close hides it).
 * @param props - composed slot props + injected hooks.
 * @returns the overlay element tree, or null.
 */
export function UsageOverlay({ t, useSessions, useUsageVisible }) {
    const visible = useUsageVisible((value) => value);
    useEffect(() => {
        if (!visible)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                usageOverlay.close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [visible]);
    if (!visible)
        return null;
    const translator = t;
    return (_jsx("div", { className: css.backdrop, role: "presentation", onClick: () => usageOverlay.close(), children: _jsxs("div", { className: css.panel, role: "dialog", "aria-label": translator('title'), onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: css.header, children: [_jsx("h2", { className: css.title, children: translator('title') }), _jsx("button", { type: "button", className: css.close, "aria-label": translator('close'), onClick: () => usageOverlay.close(), children: "\u00D7" })] }), _jsx("div", { className: css.body, children: _jsx(UsagePanel, { useSessions: useSessions, t: translator }) })] }) }));
}
//# sourceMappingURL=UsageOverlay.js.map