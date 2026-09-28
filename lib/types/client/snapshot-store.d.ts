/**
 * Local snapshot store: the API- and semantics-compatible subset of
 * `createSnapshotStore` from `@deepseek-ai/dsh-client-runtime/client` that this
 * package uses (`getSnapshot` / `subscribe` / `update` / `set`, no options).
 *
 * Vendored because DSH 0.1.2 hosts no longer materialize that package in the
 * client module table (issue #4): it was our only *runtime* import from it, and
 * a single missed `require` took the whole client bundle down. All other
 * imports from that package in this codebase are `import type` only and are
 * erased at build time.
 *
 * Semantics kept from the runtime original: update() recipes mutate a draft
 * (copy-on-write, plain objects/arrays only) and produce a new snapshot with
 * structural sharing — untouched subtrees keep their identity so
 * `useSyncExternalStore`-style consumers skip re-rendering unchanged slices.
 */
/** The store handle as the sections and controllers consume it. */
export interface SnapshotStore<T> {
    getSnapshot(): T;
    subscribe(listener: (state: T, prev: T) => void): () => void;
    update(recipe: (draft: T) => void): void;
    set(next: T): void;
}
export declare function createSnapshotStore<T extends object>(init: T): SnapshotStore<T>;
//# sourceMappingURL=snapshot-store.d.ts.map