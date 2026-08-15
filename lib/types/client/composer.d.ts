/**
 * Composer input remapper: lets users rebind the send / newline gestures.
 *
 * Native composer behavior (ui-conversation InputBar): plain Enter submits,
 * Shift+Enter inserts a newline. When a user rebinds either gesture, this
 * capture-phase listener on `window` intercepts the Enter keydown BEFORE the
 * textarea's own handler and either:
 *   - re-dispatches a plain Enter on the textarea (send — the composer's own
 *     JS handler runs and submits, so untrusted-event default-action limits
 *     don't matter), or
 *   - inserts the newline manually via `setRangeText` + an `input` event
 *     (React's onChange picks it up and the draft updates).
 * Suppressed gestures (native forms whose default was rebound away) are
 * simply consumed. IME compositions are never touched.
 */
import type { ShortcutConfig } from './config.ts';
/**
 * Install the composer remapper for one shortcuts config. Re-installable:
 * returns the disposer.
 * @param shortcuts - normalized shortcut config.
 * @returns the disposer removing the listener.
 */
export declare function installComposerInput(shortcuts: ShortcutConfig): () => void;
//# sourceMappingURL=composer.d.ts.map