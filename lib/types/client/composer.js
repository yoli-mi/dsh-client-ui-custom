import { composerRemapDecision, parseKeyCombo } from "./shortcuts.js";
/** Marker placed on remapped events so the listener ignores its own echoes. */
const REMAPPED = '__dsuRemapped';
function insertNewline(target) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.setRangeText('\n', start, end, 'end');
    target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak', data: '\n' }));
}
function dispatchNativeSend(target) {
    const event = new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true,
    });
    event[REMAPPED] = true;
    target.dispatchEvent(event);
}
/**
 * Install the composer remapper for one shortcuts config. Re-installable:
 * returns the disposer.
 * @param shortcuts - normalized shortcut config.
 * @returns the disposer removing the listener.
 */
export function installComposerInput(shortcuts) {
    const sendCombo = parseKeyCombo(shortcuts.sendMessage);
    const newlineCombo = parseKeyCombo(shortcuts.newline);
    if (sendCombo === null && newlineCombo === null)
        return () => { };
    const handler = (event) => {
        if (event[REMAPPED] === true)
            return;
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement))
            return;
        // IME composition guard: never steal Enter while composing (Chinese/JP IME).
        if (event.isComposing || event.keyCode === 229)
            return;
        const decision = composerRemapDecision(sendCombo, newlineCombo, event);
        if (decision === null)
            return;
        event.preventDefault();
        event.stopPropagation();
        if (decision === 'send')
            dispatchNativeSend(target);
        else if (decision === 'newline')
            insertNewline(target);
        // 'suppress' consumes the gesture; nothing else to do.
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
}
//# sourceMappingURL=composer.js.map