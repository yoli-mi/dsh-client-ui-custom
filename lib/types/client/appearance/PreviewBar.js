import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Floating preview hint (shell.overlay): while the appearance draft is
 * previewed on the document the screen stays clean — just a small "press F2 to
 * exit preview" pill. F2 exits preview mode and reopens the settings page,
 * where the user continues tweaking and finally decides to apply (save) or
 * cancel. (Escape is deliberately NOT used: the settings dialog closes on a
 * document-level Escape, so the reopen would be closed by the same keypress.)
 */
import { useEffect } from 'react';
import css from './PreviewBar.module.css';
/** The exit key shown in the hint and listened for. */
const EXIT_KEY = 'F2';
/**
 * Render the clean preview hint (null while not previewing).
 * @param props - composed slot props + injected exit action.
 * @returns the hint element tree, or null.
 */
export function PreviewBar({ t, usePreviewVisible, onExit }) {
    const visible = usePreviewVisible((value) => value);
    const translator = t;
    useEffect(() => {
        if (!visible)
            return;
        const onKey = (event) => {
            if (event.key === EXIT_KEY) {
                event.preventDefault();
                onExit();
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [visible, onExit]);
    if (!visible)
        return null;
    return (_jsx("div", { className: css.hint, role: "status", children: translator('previewingBar') }));
}
//# sourceMappingURL=PreviewBar.js.map