/**
 * Shortcuts: user-customizable keybindings that dispatch plugin actions.
 *
 * Parsing and matching are pure (no DOM), so they are unit-testable. The
 * combo syntax is `Mod+Alt+Shift+<key>` where `Mod` matches Ctrl **or** Meta
 * (platform-agnostic), `Alt`/`Shift` are optional modifiers, and `<key>` is a
 * single letter/digit or a named key (`space`, `enter`, `f5`, `arrowup`, …).
 * An empty or invalid spec disables the binding.
 */
/**
 * All actions, in config/settings order. `sendMessage` / `newline` are
 * composer-input remaps (handled by the composer listener), not dispatcher
 * actions — the dispatcher iterates SHORTCUT_HANDLERS' keys instead.
 */
export const SHORTCUT_ACTIONS = [
    'newConversation',
    'switchModel',
    'cycleThinking',
    'sendMessage',
    'newline',
    'usagePanel',
];
/** Named key tokens → the `event.key` value they represent. */
const NAMED_KEYS = {
    space: ' ', enter: 'Enter', esc: 'Escape', escape: 'Escape', tab: 'Tab',
    backspace: 'Backspace', delete: 'Delete', up: 'ArrowUp', down: 'ArrowDown',
    left: 'ArrowLeft', right: 'ArrowRight', arrowup: 'ArrowUp', arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft', arrowright: 'ArrowRight', home: 'Home', end: 'End',
    pageup: 'PageUp', pagedown: 'PageDown', insert: 'Insert',
};
const MODIFIER_TOKENS = new Set(['mod', 'cmd', 'ctrl', 'control', 'meta', 'super', 'win']);
const ALT_TOKENS = new Set(['alt', 'option']);
const SHIFT_TOKENS = new Set(['shift']);
/**
 * Parse a key-combo spec into a normalized {@link KeyCombo}.
 * @param spec - e.g. 'Mod+Shift+N'; '' / undefined / malformed → null (disabled).
 * @returns the parsed combo, or null.
 */
export function parseKeyCombo(spec) {
    if (spec === undefined)
        return null;
    const tokens = spec.split('+').map((token) => token.trim().toLowerCase()).filter((token) => token !== '');
    if (tokens.length === 0)
        return null;
    let mod = false;
    let alt = false;
    let shift = false;
    let keyToken;
    for (const token of tokens) {
        if (MODIFIER_TOKENS.has(token)) {
            mod = true;
            continue;
        }
        if (ALT_TOKENS.has(token)) {
            alt = true;
            continue;
        }
        if (SHIFT_TOKENS.has(token)) {
            shift = true;
            continue;
        }
        if (keyToken !== undefined)
            return null; // two non-modifier keys
        keyToken = token;
    }
    if (keyToken === undefined)
        return null; // modifiers only, no key
    if (keyToken.length === 1) {
        const key = keyToken.toLowerCase();
        if (!/^[a-z0-9]$/.test(key))
            return null;
        return { mod, alt, shift, key };
    }
    const named = NAMED_KEYS[keyToken];
    if (named !== undefined)
        return { mod, alt, shift, key: named };
    if (/^f([1-9]|1[0-9]|2[0-4])$/.test(keyToken))
        return { mod, alt, shift, key: keyToken.toUpperCase() };
    return null;
}
/**
 * Whether a keyboard event matches a parsed combo. Modifier matching is
 * strict: unspecified modifiers must be released (Mod matches Ctrl or Meta).
 * @param combo - parsed combo.
 * @param event - the keyboard event (minimal structural type for tests).
 */
export function matchesKeyCombo(combo, event) {
    const modPressed = event.ctrlKey || event.metaKey;
    if (combo.mod ? !modPressed : modPressed)
        return false;
    if (combo.alt !== event.altKey)
        return false;
    if (combo.shift !== event.shiftKey)
        return false;
    return event.key === combo.key;
}
/** Build the action → parsed-combo lookup for a normalized shortcuts config. */
export function buildShortcutMap(shortcuts) {
    return {
        newConversation: parseKeyCombo(shortcuts.newConversation),
        switchModel: parseKeyCombo(shortcuts.switchModel),
        cycleThinking: parseKeyCombo(shortcuts.cycleThinking),
        sendMessage: parseKeyCombo(shortcuts.sendMessage),
        newline: parseKeyCombo(shortcuts.newline),
        usagePanel: parseKeyCombo(shortcuts.usagePanel),
    };
}
/** Whether the combo is non-null (i.e. the action is enabled). */
export function comboEnabled(combo) {
    return combo !== null;
}
/**
 * Whether a keydown target is an editable field (input/textarea/contenteditable).
 * Plain-letter combos are suppressed there so typing is never hijacked; combos
 * carrying Mod (Ctrl/Meta) still fire (standard editor behavior).
 */
export function isEditableTarget(target) {
    if (target === null || !(target instanceof HTMLElement))
        return false;
    const element = target;
    return element.isContentEditable
        || element.tagName === 'INPUT'
        || element.tagName === 'TEXTAREA'
        || element.tagName === 'SELECT';
}
/** Modifier-only event.key values (a lone press records nothing). */
const MODIFIER_EVENT_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);
/**
 * Map a pressed `event.key` to its combo token ('n', 'space', 'arrowup',
 * 'f5', …). Returns null for modifier-only or unknown keys.
 * @param eventKey - the keyboard event's key value.
 */
export function keyToToken(eventKey) {
    if (MODIFIER_EVENT_KEYS.has(eventKey))
        return null;
    if (eventKey === ' ')
        return 'space';
    if (eventKey.length === 1)
        return eventKey.toLowerCase();
    const lower = eventKey.toLowerCase();
    for (const [token, key] of Object.entries(NAMED_KEYS)) {
        if (key === eventKey)
            return token;
    }
    if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(eventKey))
        return lower;
    return null;
}
/**
 * Build a combo spec from a keydown event (for the settings recorder).
 * Modifier-only presses (e.g. pressing Ctrl alone) return null — the recorder
 * waits for the actual key.
 * @param event - the keyboard event.
 * @returns a combo spec like 'Mod+Alt+N', or null.
 */
export function specFromEvent(event) {
    const key = keyToToken(event.key);
    if (key === null)
        return null;
    return `${event.ctrlKey || event.metaKey ? 'Mod+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${key}`;
}
/**
 * Decide how an Enter keydown in the composer textarea should be handled
 * given the user's send/newline bindings.
 *
 * The composer's native behavior is: plain Enter (no Shift/Alt) submits,
 * Shift+Enter (no Ctrl/Meta/Alt) inserts a newline. The remapper only acts
 * when the user rebinds one of those gestures away from its native form:
 *   - a user send combo that isn't native Enter → remap to native send;
 *   - a user newline combo that isn't native Shift+Enter → remap to newline;
 *   - a native gesture whose default was rebound → suppress it;
 *   - otherwise → null (let the composer handle it natively).
 * Send wins over newline when both bindings match one gesture. Compositions
 * (IME) are never remapped.
 * @param sendCombo - parsed sendMessage combo (null = default).
 * @param newlineCombo - parsed newline combo (null = default).
 * @param event - the Enter keydown (structural type for tests).
 * @returns the remap decision.
 */
export function composerRemapDecision(sendCombo, newlineCombo, event) {
    if (event.isComposing)
        return null;
    if (event.key !== 'Enter')
        return null;
    const nativeSend = !event.shiftKey && !event.altKey;
    const nativeNewline = event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
    const sendIsNative = sendCombo !== null && !sendCombo.mod && !sendCombo.shift && !sendCombo.alt && sendCombo.key === 'Enter';
    const newlineIsNative = newlineCombo !== null && newlineCombo.key === 'Enter' && newlineCombo.shift && !newlineCombo.mod && !newlineCombo.alt;
    const isUserSend = sendCombo !== null && matchesKeyCombo(sendCombo, event);
    const isUserNewline = newlineCombo !== null && matchesKeyCombo(newlineCombo, event);
    if (isUserSend)
        return sendIsNative ? null : 'send';
    if (isUserNewline && !newlineIsNative)
        return 'newline';
    if (nativeSend && sendCombo !== null && !sendIsNative)
        return 'suppress';
    if (nativeNewline && newlineCombo !== null && !newlineIsNative)
        return 'suppress';
    return null;
}
//# sourceMappingURL=shortcuts.js.map