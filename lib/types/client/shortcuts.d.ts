/**
 * Shortcuts: user-customizable keybindings that dispatch plugin actions.
 *
 * Parsing and matching are pure (no DOM), so they are unit-testable. The
 * combo syntax is `Mod+Alt+Shift+<key>` where `Mod` matches Ctrl **or** Meta
 * (platform-agnostic), `Alt`/`Shift` are optional modifiers, and `<key>` is a
 * single letter/digit or a named key (`space`, `enter`, `f5`, `arrowup`, …).
 * An empty or invalid spec disables the binding.
 */
/** The built-in shortcut actions. */
export type ShortcutAction = 'newConversation' | 'switchModel' | 'cycleThinking' | 'sendMessage' | 'newline' | 'usagePanel';
/**
 * All actions, in config/settings order. `sendMessage` / `newline` are
 * composer-input remaps (handled by the composer listener), not dispatcher
 * actions — the dispatcher iterates SHORTCUT_HANDLERS' keys instead.
 */
export declare const SHORTCUT_ACTIONS: readonly ShortcutAction[];
/** A parsed key combination. */
export interface KeyCombo {
    /** Ctrl or Meta (either matches). */
    mod: boolean;
    alt: boolean;
    shift: boolean;
    /** Normalized `event.key` value to match ('n', ' ', 'Enter', 'F5', …). */
    key: string;
}
/**
 * Parse a key-combo spec into a normalized {@link KeyCombo}.
 * @param spec - e.g. 'Mod+Shift+N'; '' / undefined / malformed → null (disabled).
 * @returns the parsed combo, or null.
 */
export declare function parseKeyCombo(spec: string | undefined): KeyCombo | null;
/**
 * Whether a keyboard event matches a parsed combo. Modifier matching is
 * strict: unspecified modifiers must be released (Mod matches Ctrl or Meta).
 * @param combo - parsed combo.
 * @param event - the keyboard event (minimal structural type for tests).
 */
export declare function matchesKeyCombo(combo: KeyCombo, event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): boolean;
/** Build the action → parsed-combo lookup for a normalized shortcuts config. */
export declare function buildShortcutMap(shortcuts: Readonly<Record<ShortcutAction, string>>): Readonly<Record<ShortcutAction, KeyCombo | null>>;
/** Whether the combo is non-null (i.e. the action is enabled). */
export declare function comboEnabled(combo: KeyCombo | null): combo is KeyCombo;
/**
 * Whether a keydown target is an editable field (input/textarea/contenteditable).
 * Plain-letter combos are suppressed there so typing is never hijacked; combos
 * carrying Mod (Ctrl/Meta) still fire (standard editor behavior).
 */
export declare function isEditableTarget(target: EventTarget | null): boolean;
/**
 * Map a pressed `event.key` to its combo token ('n', 'space', 'arrowup',
 * 'f5', …). Returns null for modifier-only or unknown keys.
 * @param eventKey - the keyboard event's key value.
 */
export declare function keyToToken(eventKey: string): string | null;
/**
 * Build a combo spec from a keydown event (for the settings recorder).
 * Modifier-only presses (e.g. pressing Ctrl alone) return null — the recorder
 * waits for the actual key.
 * @param event - the keyboard event.
 * @returns a combo spec like 'Mod+Alt+N', or null.
 */
export declare function specFromEvent(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): string | null;
/** What the composer-input remapper should do with an Enter keydown. */
export type ComposerRemap = 'send' | 'newline' | 'suppress' | null;
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
export declare function composerRemapDecision(sendCombo: KeyCombo | null, newlineCombo: KeyCombo | null, event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'isComposing'>): ComposerRemap;
//# sourceMappingURL=shortcuts.d.ts.map