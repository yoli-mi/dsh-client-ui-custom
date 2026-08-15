/**
 * Usage-overlay visibility store: a tiny module-level HostObservable so the
 * keyboard shortcut can pop the usage panel from anywhere. The shell.overlay
 * entry subscribes and renders null while hidden.
 */
/** HostObservable<boolean> face the overlay entry binds. */
export declare const usageOverlay: {
    /** @returns whether the usage panel is currently shown. */
    getSnapshot: () => boolean;
    /** Subscribe to visibility changes. */
    subscribe: (listener: () => void) => (() => void);
    /** Toggle the panel (shortcut action). */
    toggle: () => void;
    /** Hide the panel (close button / Esc). */
    close: () => void;
};
//# sourceMappingURL=usage-overlay.d.ts.map