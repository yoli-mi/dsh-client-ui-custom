// @vitest-environment node
/**
 * Vendored snapshot store (snapshot-store.ts): pins the semantics the plugin
 * relied on in the runtime original — notify-on-change, structural sharing,
 * nested draft mutation, cross-branch draft assignment, and the notify skips
 * when a recipe changes nothing (issue #4 regression companion).
 */
import { describe, expect, it, vi } from 'vitest'
import { createSnapshotStore } from '../src/client/snapshot-store.ts'

interface Page {
  status: 'loading' | 'ready'
  items: { id: number; label: string }[]
  meta: { total: number }
}

const page = (): Page => ({
  status: 'loading',
  items: [
    { id: 1, label: 'one' },
    { id: 2, label: 'two' },
  ],
  meta: { total: 2 },
})

describe('createSnapshotStore', () => {
  it('notifies subscribers with (next, prev) on update', () => {
    const store = createSnapshotStore(page())
    const seen: Array<[Page, Page]> = []
    store.subscribe((state, prev) => seen.push([state, prev]))
    store.update((draft) => {
      draft.status = 'ready'
    })
    expect(seen).toHaveLength(1)
    expect(seen[0][0].status).toBe('ready')
    expect(seen[0][1].status).toBe('loading')
    expect(store.getSnapshot().status).toBe('ready')
  })

  it('shares untouched subtrees by reference', () => {
    const initial = page()
    const store = createSnapshotStore(initial)
    let latest: Page | null = null
    store.subscribe((state) => {
      latest = state
    })
    store.update((draft) => {
      draft.meta.total = 5
    })
    expect(latest).not.toBe(initial)
    expect(latest!.meta).not.toBe(initial.meta)
    // items subtree untouched → identical reference
    expect(latest!.items).toBe(initial.items)
    expect(latest!.items[0]).toBe(initial.items[0])
  })

  it('mutating a deep node rebuilds the ancestor chain to the root', () => {
    const initial = page()
    const store = createSnapshotStore(initial)
    store.update((draft) => {
      draft.items[1].label = 'deux'
    })
    const next = store.getSnapshot()
    expect(next.items[1].label).toBe('deux')
    expect(next.items).not.toBe(initial.items)
    expect(next.items[1]).not.toBe(initial.items[1])
    expect(next.items[0]).toBe(initial.items[0])
    expect(next.meta).toBe(initial.meta)
  })

  it('a recipe that changes nothing keeps the snapshot identity and skips notify', () => {
    const initial = page()
    const store = createSnapshotStore(initial)
    const listener = vi.fn()
    store.subscribe(listener)
    store.update((draft) => {
      void draft.items.length // read-only
    })
    expect(store.getSnapshot()).toBe(initial)
    expect(listener).not.toHaveBeenCalled()
  })

  it('array writes through drafts notify and preserve element identity', () => {
    const initial = page()
    const store = createSnapshotStore(initial)
    store.update((draft) => {
      draft.items.push({ id: 3, label: 'three' })
    })
    const next = store.getSnapshot()
    expect(next.items).toHaveLength(3)
    expect(next.items[0]).toBe(initial.items[0])
    expect(next.items[1]).toBe(initial.items[1])
    expect(next.items[2].label).toBe('three')
  })

  it('assigning one draft subtree into another spot lands finalized, not proxied', () => {
    const initial = page()
    const store = createSnapshotStore(initial)
    store.update((draft) => {
      draft.items[0].label = 'uno'
      draft.meta = draft.items[0] as unknown as Page['meta']
    })
    const next = store.getSnapshot()
    expect(next.meta).toEqual({ id: 1, label: 'uno' } as unknown as Page['meta'])
    expect(String(next.meta)).toBe('[object Object]')
  })

  it('set() replaces the snapshot wholesale and notifies once', () => {
    const store = createSnapshotStore(page())
    const listener = vi.fn()
    store.subscribe(listener)
    const fresh = page()
    store.set(fresh)
    expect(store.getSnapshot()).toBe(fresh)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('unsubscribed listeners stop hearing updates', () => {
    const store = createSnapshotStore(page())
    const listener = vi.fn()
    const off = store.subscribe(listener)
    off()
    store.update((draft) => {
      draft.status = 'ready'
    })
    expect(listener).not.toHaveBeenCalled()
  })
})
