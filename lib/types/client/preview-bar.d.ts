/**
 * Preview-mode visibility store: a tiny module-level HostObservable so the
 * floating preview bar (shell.overlay) can appear when the appearance draft is
 * previewed on the document. The bar is shown by the appearance controller on
 * preview / preset-apply and hidden when the preview is saved, cancelled, or
 * invalidated — independent from the controller's `previewing` flag, because
 * "back to settings" keeps the draft staged while the bar itself disappears.
 */
/** HostObservable<boolean> face the preview bar entry binds. */
export declare const previewBar: {
    /** @returns whether the preview bar is currently shown. */
    getSnapshot: () => boolean;
    /** Subscribe to visibility changes. */
    subscribe: (listener: () => void) => (() => void);
    /** Show the bar (entering preview mode). */
    show: () => void;
    /** Hide the bar (saved / cancelled / back to settings). */
    hide: () => void;
};
//# sourceMappingURL=preview-bar.d.ts.map