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
export function createSnapshotStore(init) {
    let state = init;
    const listeners = new Set();
    const publish = (next) => {
        const prev = state;
        state = next;
        if (prev !== next)
            for (const fn of [...listeners])
                fn(next, prev);
    };
    return {
        getSnapshot: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        update: (recipe) => publish(produce(state, recipe)),
        set: publish,
    };
}
function produce(base, recipe) {
    // original object → its draft node (one draft per distinct object)
    const nodes = new Map();
    // proxy → its draft node (unwraps drafts assigned across branches)
    const byProxy = new Map();
    // nodes whose copy content differs from the original
    const written = new Set();
    let changed = false;
    const draftOf = (node, parent, key) => {
        const existing = nodes.get(node);
        if (existing !== undefined)
            return existing.proxy;
        const draft = {
            original: node,
            copy: shallowCopy(node),
            proxy: null,
            parent,
            key,
        };
        draft.proxy = new Proxy(draft.copy, handler(draft));
        nodes.set(node, draft);
        byProxy.set(draft.proxy, draft);
        return draft.proxy;
    };
    /** Writing a node invalidates every ancestor snapshot on the path to the root. */
    const markChanged = (draft) => {
        let node = draft;
        while (node !== null) {
            written.add(node);
            if (node.parent !== null)
                node.parent.copy[node.key] = node.proxy;
            node = node.parent;
        }
    };
    const handler = (draft) => ({
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (isDraftable(value))
                return draftOf(value, draft, prop);
            return value;
        },
        set(target, prop, value, receiver) {
            changed = true;
            markChanged(draft);
            // a draft assigned into another spot stays proxied: finalize resolves it
            // to that subtree's result (copy when written, original otherwise)
            return Reflect.set(target, prop, value, receiver);
        },
        deleteProperty(target, prop) {
            changed = true;
            markChanged(draft);
            return Reflect.deleteProperty(target, prop);
        },
    });
    const finalize = (draft) => {
        if (!written.has(draft))
            return draft.original;
        for (const key of Reflect.ownKeys(draft.copy)) {
            const child = draft.copy[key];
            // slots written through drafts hold the child's proxy — resolve it
            const childDraft = typeof child === 'object' && child !== null ? byProxy.get(child) : undefined;
            if (childDraft !== undefined) {
                ;
                draft.copy[key] = finalize(childDraft);
            }
        }
        return draft.copy;
    };
    recipe(draftOf(base, null, ''));
    return changed ? finalize(nodes.get(base)) : base;
}
const isDraftable = (value) => typeof value === 'object' &&
    value !== null &&
    (Array.isArray(value) ||
        Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null);
const shallowCopy = (node) => Array.isArray(node) ? [...node] : { ...node };
//# sourceMappingURL=snapshot-store.js.map