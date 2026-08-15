/**
 * Per-message pin ("悬挂") control, rendered in the assistant message's
 * IconActions row (between copy and branch, via the
 * conversation.chat.assistant-actions slot). Pinning a turn makes its history
 * bar ignore the strip's count limit and marks it with the theme-accent
 * frame. Only renders while the history strip is enabled (historyPosition
 * ≠ 'off') — with the strip hidden there is nothing to pin to.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { PinTurnInjected } from './contract.ts';
/** Full props of the per-message pin entry. */
export type PinTurnActionProps = PropsRuntime<'conversation.chat.assistant-actions'> & PropsLocale<'pin'> & InjectFace<PinTurnInjected>;
/**
 * Render the pin toggle for one turn's assistant message.
 * @param props - owner turn/message identity + injected scope face + locale.
 */
export declare function PinTurnAction({ turn, sessionId, usePosition, usePinnedTurns, togglePin, t }: PinTurnActionProps): import("react").JSX.Element | null;
//# sourceMappingURL=PinTurnAction.d.ts.map