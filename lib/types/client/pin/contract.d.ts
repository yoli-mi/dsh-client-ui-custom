/**
 * Pin ("悬挂") entry contract: the injected face of one assistant-actions
 * entry that pins a turn to the history strip. The turn number comes from the
 * slot owner (ui-conversation passes it), pins are stored per session in the
 * ui-custom settings scope, and the button only renders while the history
 * strip is enabled (historyPosition ≠ 'off').
 */
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { UiCustomSection } from '../../shared.ts';
/** Injected business face of the per-message pin entry. */
export interface PinTurnInjected {
    /** The owning session id (pins are stored per session). */
    sessionId: string;
    hooks: {
        /** The ui-custom settings scope, read for the strip position + pinned turns. */
        position: SettingsScope<UiCustomSection>;
        pinnedTurns: SettingsScope<UiCustomSection>;
    };
    /** Toggle the pinned flag for one turn in this session. */
    togglePin: (turn: number) => void;
}
/** The framework-bound hook shape the component receives (host observable). */
export type PinTurnHook = HostObservable<unknown>;
//# sourceMappingURL=contract.d.ts.map