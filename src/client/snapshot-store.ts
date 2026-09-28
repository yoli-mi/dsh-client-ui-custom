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
  getSnapshot(): T
  subscribe(listener: (state: T, prev: T) => void): () => void
  update(recipe: (draft: T) => void): void
  set(next: T): void
}

export function createSnapshotStore<T extends object>(init: T): SnapshotStore<T> {
  let state = init
  const listeners = new Set<(state: T, prev: T) => void>()
  const publish = (next: T): void => {
    const prev = state
    state = next
    if (prev !== next) for (const fn of [...listeners]) fn(next, prev)
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update: (recipe) => publish(produce(state, recipe)),
    set: publish,
  }
}

/**
 * Copy-on-write `produce`: recipes mutate a proxy draft; nodes are shallow-
 * copied lazily, and writing a node marks its whole ancestor chain so the
 * change is visible from the root. Untouched subtrees are returned by
 * reference (structural sharing, immer-style). Supported state shapes are the
 * ones this package stores: plain objects, arrays, and primitives. Class
 * instances, Maps/Sets, and objects reachable through two different paths
 * (DAG states) are not tracked — the recipe would see the raw object and the
 * change would not notify.
 */
interface DraftNode {
  original: object
  copy: object
  proxy: object
  parent: DraftNode | null
  /** key this node sits under in its parent's copy */
  key: string | symbol
}

function produce<T>(base: T, recipe: (draft: T) => void): T {
  // original object → its draft node (one draft per distinct object)
  const nodes = new Map<object, DraftNode>()
  // proxy → its draft node (unwraps drafts assigned across branches)
  const byProxy = new Map<object, DraftNode>()
  // nodes whose copy content differs from the original
  const written = new Set<DraftNode>()
  let changed = false

  const draftOf = (node: object, parent: DraftNode | null, key: string | symbol): object => {
    const existing = nodes.get(node)
    if (existing !== undefined) return existing.proxy
    const draft: DraftNode = {
      original: node,
      copy: shallowCopy(node),
      proxy: null as unknown as object,
      parent,
      key,
    }
    draft.proxy = new Proxy(draft.copy, handler(draft))
    nodes.set(node, draft)
    byProxy.set(draft.proxy, draft)
    return draft.proxy
  }

  /** Writing a node invalidates every ancestor snapshot on the path to the root. */
  const markChanged = (draft: DraftNode): void => {
    let node: DraftNode | null = draft
    while (node !== null) {
      written.add(node)
      if (node.parent !== null) node.parent.copy[node.key] = node.proxy
      node = node.parent
    }
  }

  const handler = (draft: DraftNode): ProxyHandler<object> => ({
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (isDraftable(value)) return draftOf(value, draft, prop)
      return value
    },
    set(target, prop, value, receiver) {
      changed = true
      markChanged(draft)
      // a draft assigned into another spot stays proxied: finalize resolves it
      // to that subtree's result (copy when written, original otherwise)
      return Reflect.set(target, prop, value, receiver)
    },
    deleteProperty(target, prop) {
      changed = true
      markChanged(draft)
      return Reflect.deleteProperty(target, prop)
    },
  })

  const finalize = (draft: DraftNode): unknown => {
    if (!written.has(draft)) return draft.original
    for (const key of Reflect.ownKeys(draft.copy)) {
      const child = (draft.copy as Record<string | symbol, unknown>)[key]
      // slots written through drafts hold the child's proxy — resolve it
      const childDraft =
        typeof child === 'object' && child !== null ? byProxy.get(child) : undefined
      if (childDraft !== undefined) {
        ;(draft.copy as Record<string | symbol, unknown>)[key] = finalize(childDraft)
      }
    }
    return draft.copy
  }

  recipe(draftOf(base as object, null, '') as T)
  return changed ? (finalize(nodes.get(base as object)!) as T) : base
}

const isDraftable = (value: unknown): value is object =>
  typeof value === 'object' &&
  value !== null &&
  (Array.isArray(value) ||
    Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null)

const shallowCopy = (node: object): object =>
  Array.isArray(node) ? [...node] : { ...node }
