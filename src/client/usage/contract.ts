/** Shared inject faces for the app-usage surfaces (section + overlay). */

import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'

/** Settings-section inject face. */
export interface UsageInjected {
  hooks: {
    /** Bound sessions list (rows carry projectionValues + updatedAt). */
    sessions: HostObservable<SessionListState>
  }
}

/** Overlay inject face: sessions + the visibility store. */
export interface UsageOverlayInjected {
  hooks: {
    sessions: HostObservable<SessionListState>
    /** Visibility store (usage-overlay.ts). */
    usageVisible: HostObservable<boolean>
  }
}
