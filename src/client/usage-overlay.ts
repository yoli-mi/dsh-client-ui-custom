/**
 * Usage-overlay visibility store: a tiny module-level HostObservable so the
 * keyboard shortcut can pop the usage panel from anywhere. The shell.overlay
 * entry subscribes and renders null while hidden.
 */

interface UsageOverlayState {
  visible: boolean
  listeners: Set<() => void>
}

const state: UsageOverlayState = { visible: false, listeners: new Set() }

const notify = (): void => {
  for (const listener of [...state.listeners]) listener()
}

/** HostObservable<boolean> face the overlay entry binds. */
export const usageOverlay = {
  /** @returns whether the usage panel is currently shown. */
  getSnapshot: (): boolean => state.visible,
  /** Subscribe to visibility changes. */
  subscribe: (listener: () => void): (() => void) => {
    state.listeners.add(listener)
    return () => state.listeners.delete(listener)
  },
  /** Toggle the panel (shortcut action). */
  toggle: (): void => {
    state.visible = !state.visible
    notify()
  },
  /** Hide the panel (close button / Esc). */
  close: (): void => {
    if (!state.visible) return
    state.visible = false
    notify()
  },
}
