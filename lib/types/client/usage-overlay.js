/**
 * Usage-overlay visibility store: a tiny module-level HostObservable so the
 * keyboard shortcut can pop the usage panel from anywhere. The shell.overlay
 * entry subscribes and renders null while hidden.
 */
const state = { visible: false, listeners: new Set() };
const notify = () => {
    for (const listener of [...state.listeners])
        listener();
};
/** HostObservable<boolean> face the overlay entry binds. */
export const usageOverlay = {
    /** @returns whether the usage panel is currently shown. */
    getSnapshot: () => state.visible,
    /** Subscribe to visibility changes. */
    subscribe: (listener) => {
        state.listeners.add(listener);
        return () => state.listeners.delete(listener);
    },
    /** Toggle the panel (shortcut action). */
    toggle: () => {
        state.visible = !state.visible;
        notify();
    },
    /** Hide the panel (close button / Esc). */
    close: () => {
        if (!state.visible)
            return;
        state.visible = false;
        notify();
    },
};
//# sourceMappingURL=usage-overlay.js.map