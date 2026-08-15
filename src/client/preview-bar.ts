/**
 * Preview-mode visibility store: a tiny module-level HostObservable so the
 * floating preview bar (shell.overlay) can appear when the appearance draft is
 * previewed on the document. The bar is shown by the appearance controller on
 * preview / preset-apply and hidden when the preview is saved, cancelled, or
 * invalidated — independent from the controller's `previewing` flag, because
 * "back to settings" keeps the draft staged while the bar itself disappears.
 */

const state = {
  visible: false,
  listeners: new Set<() => void>(),
}

const notify = (): void => {
  for (const listener of [...state.listeners]) listener()
}

/** HostObservable<boolean> face the preview bar entry binds. */
export const previewBar = {
  /** @returns whether the preview bar is currently shown. */
  getSnapshot: (): boolean => state.visible,
  /** Subscribe to visibility changes. */
  subscribe: (listener: () => void): (() => void) => {
    state.listeners.add(listener)
    return () => state.listeners.delete(listener)
  },
  /** Show the bar (entering preview mode). */
  show: (): void => {
    state.visible = true
    notify()
  },
  /** Hide the bar (saved / cancelled / back to settings). */
  hide: (): void => {
    if (!state.visible) return
    state.visible = false
    notify()
  },
}
