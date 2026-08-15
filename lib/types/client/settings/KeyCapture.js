import { jsx as _jsx } from "react/jsx-runtime";
/**
 * KeyCapture: a recorder button — click, press the combination, done. Uses
 * the same pure parser as the shortcut listener, so a recorded spec always
 * round-trips. Esc cancels; modifier-only presses are ignored.
 */
import { useEffect, useRef, useState } from 'react';
import { specFromEvent } from "../shortcuts.js";
import css from './ShortcutsSection.module.css'; /** Props for one recorder row. */
/**
 * Render the recorder button.
 * @param props - recorder props.
 * @returns the button element.
 */
export function KeyCapture({ value, onChange, t, disabled, id }) {
    const [recording, setRecording] = useState(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    useEffect(() => {
        if (!recording)
            return;
        const onKeyDown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === 'Escape') {
                setRecording(false);
                return;
            }
            const spec = specFromEvent(event);
            if (spec !== null) {
                onChangeRef.current(spec);
                setRecording(false);
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [recording]);
    return (_jsx("button", { type: "button", id: id, className: recording ? `${css.capture} ${css.captureRecording}` : css.capture, disabled: disabled, "aria-label": t('record'), onClick: () => setRecording(true), children: recording ? t('comboHint') : (value === '' ? t('comboHint') : value) }));
}
//# sourceMappingURL=KeyCapture.js.map