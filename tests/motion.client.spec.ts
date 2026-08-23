// @vitest-environment jsdom
/**
 * Conversation entrance-motion engine: stagger math, chat-row detection,
 * style classes, and the observer behavior (load batches stagger, incremental
 * batches don't, disabled buffering, disable cleanup, teardown).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  installConversationEntrance, isChatRow, isTreeItem, PANEL_ANIMATION_CLASS, ROW_IN_CLASS, SELECT_ANIMATION_CLASS,
  STAGGER_CAP_MS, STAGGER_STEP_MS, staggerDelay, styleClass,
  type MotionEngineOptions, type MotionEngineState,
} from '../src/client/motion/motion.ts'
import { DEFAULT_MOTION_STYLE, DEFAULT_NEW_CHAT_MOTION_STYLE, DEFAULT_SIDEBAR_MOTION_STYLE, type MotionStyle } from '../src/shared.ts'

// The engine scans the whole document on session-switch replays, so every
// test starts from a clean body (rows from a previous test would otherwise
// join the replay and shift the stagger).
beforeEach(() => {
  document.body.replaceChildren()
})

/** Flush the MutationObserver microtask queue. */
const flushObserver = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

/** Wait past the switch-replay delay (host commit + first scan). */
const waitReplay = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 150))

/** Harness for the engine: mutable state + captured listeners. */
function harness(initial: Partial<MotionEngineState> = {}): {
  state: { value: MotionEngineState }
  listeners: (() => void)[]
  options: MotionEngineOptions
  setState: (patch: Partial<MotionEngineState>) => void
} {
  const state = { value: { transcript: true, sidebar: true, selection: true, newChat: true, style: DEFAULT_MOTION_STYLE, sidebarStyle: DEFAULT_SIDEBAR_MOTION_STYLE, newChatStyle: DEFAULT_NEW_CHAT_MOTION_STYLE, blank: false, ...initial } }
  const listeners: (() => void)[] = []
  return {
    state,
    listeners,
    options: {
      getState: () => state.value,
      subscribe: (listener) => {
        listeners.push(listener)
        return () => {
          const i = listeners.indexOf(listener)
          if (i !== -1) listeners.splice(i, 1)
        }
      },
    },
    setState: (patch) => {
      state.value = { ...state.value, ...patch }
      for (const listener of [...listeners]) listener()
    },
  }
}

const makeRow = (key: string): HTMLElement => {
  const row = document.createElement('div')
  row.setAttribute('data-chat-anchor-key', key)
  return row
}

/** Build a sidebar tree item (inside a role=tree). */
const makeTree = (): HTMLElement => {
  const tree = document.createElement('div')
  tree.setAttribute('role', 'tree')
  document.body.appendChild(tree)
  return tree
}

const makeTreeItem = (key: string): HTMLElement => {
  const item = document.createElement('div')
  item.setAttribute('role', 'treeitem')
  item.textContent = key
  return item
}

/** Read the inline --dsu-motion-delay of a row ('' when unset). */
const delayOf = (row: HTMLElement): string => row.style.getPropertyValue('--dsu-motion-delay')

/** Whether a row carries the entrance marker (and optionally a style class). */
const markedWith = (row: HTMLElement, style?: MotionStyle): boolean =>
  row.classList.contains(ROW_IN_CLASS) && (style === undefined || row.classList.contains(styleClass(style)))

describe('staggerDelay', () => {
  it('starts at 0 and steps per row', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(1)).toBe(STAGGER_STEP_MS)
    expect(staggerDelay(3)).toBe(STAGGER_STEP_MS * 3)
  })

  it('caps the delay for long conversations', () => {
    expect(staggerDelay(100)).toBe(STAGGER_CAP_MS)
    expect(staggerDelay(9)).toBe(STAGGER_CAP_MS)
  })

  it('handles malformed indexes', () => {
    expect(staggerDelay(-5)).toBe(0)
    expect(staggerDelay(NaN)).toBe(0)
    expect(staggerDelay(2.9)).toBe(STAGGER_STEP_MS * 2)
  })
})

describe('styleClass', () => {
  it('maps every style id to its CSS class', () => {
    expect(styleClass('fade-up')).toBe('dsu-motion-fade-up')
    expect(styleClass('fade')).toBe('dsu-motion-fade')
    expect(styleClass('rise-scale')).toBe('dsu-motion-rise-scale')
    expect(styleClass('slide-in')).toBe('dsu-motion-slide-in')
    expect(styleClass('blur-in')).toBe('dsu-motion-blur-in')
    expect(styleClass('scale-in')).toBe('dsu-motion-scale-in')
    expect(styleClass('slide-left')).toBe('dsu-motion-slide-left')
    expect(styleClass('expand')).toBe('dsu-motion-expand')
    expect(styleClass('slide-down')).toBe('dsu-motion-slide-down')
    expect(styleClass('zoom')).toBe('dsu-motion-zoom')
  })
})

describe('isChatRow', () => {
  it('accepts anchored rows', () => {
    const row = makeRow('k1')
    document.body.appendChild(row)
    expect(isChatRow(row)).toBe(true)
  })

  it('rejects non-rows and rows nested inside a row', () => {
    const wrapper = makeRow('k0')
    const inner = makeRow('k1')
    wrapper.appendChild(inner)
    document.body.appendChild(wrapper)
    expect(isChatRow(wrapper)).toBe(true)
    expect(isChatRow(inner)).toBe(false)
    expect(isChatRow(document.createElement('span'))).toBe(false)
    expect(isChatRow(document.createTextNode('x'))).toBe(false)
  })
})

describe('isTreeItem', () => {
  it('accepts tree items inside a role=tree', () => {
    const tree = makeTree()
    const item = makeTreeItem('s')
    tree.appendChild(item)
    expect(isTreeItem(item)).toBe(true)
  })

  it('rejects non-items and items outside a tree', () => {
    expect(isTreeItem(document.createElement('div'))).toBe(false)
    const item = makeTreeItem('s')
    document.body.appendChild(item)
    expect(isTreeItem(item)).toBe(false)
  })

  it('accepts nested items (session rows inside their group row)', () => {
    const tree = makeTree()
    const wrapper = makeTreeItem('group')
    const child = makeTreeItem('child')
    wrapper.appendChild(child)
    tree.appendChild(wrapper)
    expect(isTreeItem(wrapper)).toBe(true)
    expect(isTreeItem(child)).toBe(true)
  })
})

describe('sidebar tree entrance', () => {
  it('collects tree items mounted inside a wrapper element', async () => {
    // The host mounts sidebar session rows inside a wrapping span; the added
    // node is the wrapper, not the row itself.
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const wrapper = document.createElement('span')
    const item = makeTreeItem('s')
    wrapper.appendChild(item)
    tree.appendChild(wrapper)
    await flushObserver()

    expect(markedWith(item)).toBe(true)
    engine.dispose()
  })

  it('stagger-marks nested session rows inside their group row', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const group = makeTreeItem('group')
    // The host commits parents before children (React commit order): the
    // group lands in the tree first, then its session row mounts inside it.
    tree.appendChild(group)
    const session = makeTreeItem('session')
    group.appendChild(session)
    await flushObserver()

    expect(markedWith(group)).toBe(true)
    expect(markedWith(session)).toBe(true)
    // Rows land in separate container batches (tree vs the group row), so
    // each starts its own stagger at 0.
    expect(delayOf(group)).toBe('0ms')
    expect(delayOf(session)).toBe('0ms')
    engine.dispose()
  })

  it('stagger-marks a first-render tree (empty container)', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const items = [makeTreeItem('a'), makeTreeItem('b'), makeTreeItem('c')]
    for (const item of items) tree.appendChild(item)
    await flushObserver()

    expect(markedWith(items[0]!)).toBe(true)
    expect(delayOf(items[0]!)).toBe('0ms')
    expect(delayOf(items[1]!)).toBe(`${STAGGER_STEP_MS}ms`)
    expect(delayOf(items[2]!)).toBe(`${STAGGER_STEP_MS * 2}ms`)
    engine.dispose()
  })

  it('fades in tree items on group expand (incremental) without stagger', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const first = makeTreeItem('a')
    tree.appendChild(first)
    await flushObserver()
    expect(markedWith(first)).toBe(true)

    // Expanding a workspace group mounts its session rows into the
    // already-populated tree: they fade in immediately, no stagger.
    const extra = makeTreeItem('b')
    tree.appendChild(extra)
    await flushObserver()
    expect(markedWith(extra)).toBe(true)
    expect(delayOf(extra)).toBe('0ms')
    engine.dispose()
  })

  it('traces the selection box when a tree item becomes active', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const item = makeTreeItem('s')
    tree.appendChild(item)
    await flushObserver()
    expect(item.classList.contains(SELECT_ANIMATION_CLASS)).toBe(false)

    item.setAttribute('aria-selected', 'true')
    await flushObserver()
    expect(item.classList.contains(SELECT_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('traces the selection box on an item that mounts already selected', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const item = makeTreeItem('s')
    item.setAttribute('aria-selected', 'true')
    tree.appendChild(item)
    await flushObserver()
    expect(item.classList.contains(SELECT_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('keeps the selection box on the active item and drops it on deselect', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const first = makeTreeItem('a')
    const second = makeTreeItem('b')
    tree.appendChild(first)
    tree.appendChild(second)
    await flushObserver()

    // First becomes active: its box fades in and stays.
    first.setAttribute('aria-selected', 'true')
    await flushObserver()
    expect(first.classList.contains(SELECT_ANIMATION_CLASS)).toBe(true)

    // Selection moves: the old box is dropped, the new item gets its own.
    first.setAttribute('aria-selected', 'false')
    second.setAttribute('aria-selected', 'true')
    await flushObserver()
    expect(first.classList.contains(SELECT_ANIMATION_CLASS)).toBe(false)
    expect(second.classList.contains(SELECT_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('does not trace the selection box while the selection toggle is off', async () => {
    const { options, setState } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const item = makeTreeItem('s')
    tree.appendChild(item)
    await flushObserver()
    setState({ selection: false })

    item.setAttribute('aria-selected', 'true')
    await flushObserver()
    expect(item.classList.contains(SELECT_ANIMATION_CLASS)).toBe(false)
    engine.dispose()
  })

  it('clears a persistent selection box when the selection toggle turns off', async () => {
    const { options, setState } = harness()
    const engine = installConversationEntrance(options)
    const tree = makeTree()
    const item = makeTreeItem('s')
    tree.appendChild(item)
    await flushObserver()
    item.setAttribute('aria-selected', 'true')
    await flushObserver()
    expect(item.classList.contains(SELECT_ANIMATION_CLASS)).toBe(true)

    setState({ selection: false })
    expect(item.classList.contains(SELECT_ANIMATION_CLASS)).toBe(false)
    engine.dispose()
  })

  it('marks a pre-mounted tree on install (boot race)', async () => {
    // Tree mounts BEFORE the engine installs (page-restored session).
    const tree = makeTree()
    const items = [makeTreeItem('a'), makeTreeItem('b')]
    for (const item of items) tree.appendChild(item)
    const { options } = harness()
    const engine = installConversationEntrance(options)
    await flushObserver()

    expect(markedWith(items[0]!)).toBe(true)
    expect(delayOf(items[0]!)).toBe('0ms')
    expect(delayOf(items[1]!)).toBe(`${STAGGER_STEP_MS}ms`)
    engine.dispose()
  })

  it('boot scan traces the selection box on the restored active item', async () => {
    // Page-restored session: the tree (with an active item) mounts before
    // the engine installs.
    const tree = makeTree()
    const active = makeTreeItem('active')
    active.setAttribute('aria-selected', 'true')
    tree.appendChild(active)
    const other = makeTreeItem('other')
    tree.appendChild(other)
    const { options } = harness()
    const engine = installConversationEntrance(options)
    await waitReplay()

    expect(active.classList.contains(SELECT_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('boot scan runs once: re-enabling does not re-scan the tree', async () => {
    const { options, setState } = harness({ transcript: false, sidebar: false, selection: false, newChat: false })
    const tree = makeTree()
    const first = makeTreeItem('a')
    tree.appendChild(first)
    const engine = installConversationEntrance(options)
    // Enable: the boot scan marks the pre-mounted tree.
    setState({ transcript: true, sidebar: true, selection: true, newChat: true })
    await flushObserver()
    expect(markedWith(first)).toBe(true)

    // Disable (clears marks) then re-enable: the scan must not re-run.
    setState({ transcript: false, sidebar: false, selection: false, newChat: false })
    expect(first.classList.contains(ROW_IN_CLASS)).toBe(false)
    setState({ transcript: true, sidebar: true, selection: true, newChat: true })
    await flushObserver()
    expect(first.classList.contains(ROW_IN_CLASS)).toBe(false)
    engine.dispose()
  })

  it('mixes transcript rows and tree items without interference', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const tree = makeTree()
    const rows = [makeRow('m1'), makeRow('m2')]
    for (const row of rows) column.appendChild(row)
    const items = [makeTreeItem('s1'), makeTreeItem('s2')]
    for (const item of items) tree.appendChild(item)
    await flushObserver()

    expect(markedWith(rows[0]!)).toBe(true)
    expect(markedWith(items[0]!)).toBe(true)
    expect(delayOf(rows[0]!)).toBe('0ms')
    expect(delayOf(items[0]!)).toBe('0ms')
    engine.dispose()
  })

  it('applies the sidebar style to tree items and the transcript style to rows', async () => {
    const { options, setState } = harness({ sidebarStyle: 'slide-left' })
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const tree = makeTree()
    const row = makeRow('m1')
    column.appendChild(row)
    const item = makeTreeItem('s1')
    tree.appendChild(item)
    await flushObserver()

    expect(markedWith(row, 'fade-up')).toBe(true)
    expect(markedWith(item, 'slide-left')).toBe(true)
    expect(row.classList.contains(styleClass('slide-left'))).toBe(false)
    expect(item.classList.contains(styleClass('fade-up'))).toBe(false)

    // 切换侧边栏风格：只影响之后挂载的树项（新树 = load 批次）
    setState({ sidebarStyle: 'fade' })
    const tree2 = makeTree()
    const item2 = makeTreeItem('s2')
    tree2.appendChild(item2)
    await flushObserver()
    expect(markedWith(item2, 'fade')).toBe(true)
    expect(markedWith(item, 'slide-left')).toBe(true)
    engine.dispose()
  })
})

describe('installConversationEntrance', () => {
  it('stagger-marks a first render (empty container) in document order', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const rows = [makeRow('k2'), makeRow('k0'), makeRow('k1')]
    // Insert out of key order to prove the stagger follows document order.
    for (const row of rows) column.appendChild(row)
    await flushObserver()

    expect(markedWith(rows[0]!, 'fade-up')).toBe(true)
    expect(delayOf(rows[0]!)).toBe('0ms')
    expect(delayOf(rows[1]!)).toBe(`${STAGGER_STEP_MS}ms`)
    expect(delayOf(rows[2]!)).toBe(`${STAGGER_STEP_MS * 2}ms`)
    engine.dispose()
  })

  it('applies the selected style class to new rows and keeps old rows', async () => {
    const { options, setState } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const first = makeRow('k1')
    column.appendChild(first)
    await flushObserver()
    expect(markedWith(first, 'fade-up')).toBe(true)

    // Switch the style: rows mounted from now on use it, the old row keeps
    // its original animation class.
    setState({ style: 'slide-in' })
    const second = makeRow('k2')
    column.appendChild(second)
    await flushObserver()

    expect(markedWith(first, 'fade-up')).toBe(true)
    expect(markedWith(first, 'slide-in')).toBe(false)
    expect(markedWith(second, 'slide-in')).toBe(true)
    engine.dispose()
  })

  it('treats remove + add in one batch as a conversation switch (stagger)', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const first = [makeRow('old-1'), makeRow('old-2')]
    for (const row of first) column.appendChild(row)
    await flushObserver()

    for (const row of first) row.remove()
    const next = [makeRow('new-1'), makeRow('new-2')]
    for (const row of next) column.appendChild(row)
    await flushObserver()

    expect(delayOf(next[0]!)).toBe('0ms')
    expect(delayOf(next[1]!)).toBe(`${STAGGER_STEP_MS}ms`)
    engine.dispose()
  })

  it('does not stagger incremental appends (streaming / paging)', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    for (const row of [makeRow('a'), makeRow('b')]) column.appendChild(row)
    await flushObserver()

    const appended = makeRow('c')
    column.appendChild(appended)
    await flushObserver()

    expect(markedWith(appended)).toBe(true)
    expect(delayOf(appended)).toBe('0ms')
    engine.dispose()
  })

  it('replays the entrance when a marked row is reused with new content', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const row = makeRow('k')
    column.appendChild(row)
    await flushObserver()
    expect(markedWith(row)).toBe(true)

    // Simulate the host reusing the same element: remove + re-append it.
    row.remove()
    column.appendChild(row)
    await flushObserver()
    expect(markedWith(row)).toBe(true)
    engine.dispose()
  })

  it('buffers rows while disabled and applies them on enable', async () => {
    const { options, setState } = harness({ transcript: false, sidebar: false, selection: false, newChat: false })
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const rows = [makeRow('k1'), makeRow('k2')]
    for (const row of rows) column.appendChild(row)
    await flushObserver()

    // Disabled: nothing marked, but the batch is buffered.
    for (const row of rows) expect(row.classList.contains(ROW_IN_CLASS)).toBe(false)

    setState({ transcript: true, sidebar: true, selection: true, newChat: true })
    await flushObserver()
    for (const row of rows) expect(markedWith(row)).toBe(true)
    engine.dispose()
  })

  it('unmarks every row when disabled and stays quiet afterwards', async () => {
    const { options, setState } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const rows = [makeRow('k1'), makeRow('k2')]
    for (const row of rows) column.appendChild(row)
    await flushObserver()
    for (const row of rows) expect(markedWith(row)).toBe(true)

    setState({ transcript: false, sidebar: false, selection: false, newChat: false })
    for (const row of rows) {
      expect(row.classList.contains(ROW_IN_CLASS)).toBe(false)
      expect(row.classList.contains(styleClass('fade-up'))).toBe(false)
      expect(delayOf(row)).toBe('')
    }

    const appended = makeRow('k3')
    column.appendChild(appended)
    await flushObserver()
    expect(appended.classList.contains(ROW_IN_CLASS)).toBe(false)
    engine.dispose()
  })

  it('stops marking rows after dispose', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const row = makeRow('k1')
    column.appendChild(row)
    await flushObserver()
    expect(markedWith(row)).toBe(true)

    engine.dispose()
    const after = makeRow('k2')
    column.appendChild(after)
    await flushObserver()
    expect(after.classList.contains(ROW_IN_CLASS)).toBe(false)
  })
})

describe('notifySessionSwitch', () => {
  it('force-replays every mounted row with a stagger', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const rows = [makeRow('a'), makeRow('b'), makeRow('c')]
    // Rows already mounted (the observer never saw them — e.g. a host
    // transcript the engine cannot correlate): the replay must still mark.
    for (const row of rows) column.appendChild(row)
    await waitReplay()

    expect(markedWith(rows[0]!)).toBe(true)
    expect(delayOf(rows[0]!)).toBe('0ms')
    expect(delayOf(rows[1]!)).toBe(`${STAGGER_STEP_MS}ms`)
    expect(delayOf(rows[2]!)).toBe(`${STAGGER_STEP_MS * 2}ms`)
    engine.dispose()
  })

  it('replays rows that were already animated once (second visit)', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    const row = makeRow('k')
    column.appendChild(row)
    await flushObserver()
    expect(markedWith(row)).toBe(true)

    // Second visit: same DOM, classes already present — the replay must
    // restart the entrance (drop classes, reflow, re-add).
    engine.notifySessionSwitch()
    await waitReplay()
    expect(markedWith(row)).toBe(true)
    expect(delayOf(row)).toBe('0ms')
    engine.dispose()
  })

  it('replays rows added after the signal while the host commits', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    // Signal arrives before the transcript mounts.
    engine.notifySessionSwitch()
    const rows = [makeRow('a'), makeRow('b')]
    for (const row of rows) column.appendChild(row)
    await waitReplay()

    expect(markedWith(rows[0]!)).toBe(true)
    expect(markedWith(rows[1]!)).toBe(true)
    engine.dispose()
  })

  it('stays quiet while the feature is disabled', async () => {
    const { options, setState } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    document.body.appendChild(column)
    setState({ transcript: false, sidebar: false, selection: false, newChat: false })
    engine.notifySessionSwitch()
    const row = makeRow('k')
    column.appendChild(row)
    await waitReplay()

    expect(row.classList.contains(ROW_IN_CLASS)).toBe(false)
    engine.dispose()
  })

  it('stops replaying after dispose', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    engine.dispose()
    const column = document.createElement('div')
    document.body.appendChild(column)
    const row = makeRow('k')
    column.appendChild(row)
    engine.notifySessionSwitch()
    await waitReplay()

    expect(row.classList.contains(ROW_IN_CLASS)).toBe(false)
  })
})

describe('panel load animation', () => {
  it('fades the transcript column in on session switch', async () => {
    const { options } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    column.setAttribute('data-chat-flow', '')
    document.body.appendChild(column)
    const row = makeRow('k1')
    column.appendChild(row)
    await flushObserver()

    expect(column.classList.contains(PANEL_ANIMATION_CLASS)).toBe(false)
    engine.notifySessionSwitch()
    await waitReplay()
    expect(column.classList.contains(PANEL_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('fades the composer seat (blank-session hero) in on a new conversation', async () => {
    const { options } = harness({ blank: true })
    const engine = installConversationEntrance(options)
    // A brand-new conversation: no transcript rows yet, composer seat present.
    const composer = document.createElement('div')
    composer.setAttribute('data-composer-seat', '')
    document.body.appendChild(composer)
    const flow = document.createElement('div')
    flow.setAttribute('data-chat-flow', '')
    document.body.appendChild(flow)
    await flushObserver()

    expect(composer.classList.contains(styleClass('reveal'))).toBe(false)
    // The composer entrance waits for the host to render the welcome dialog
    // into the seat (that mutation fires the animation class).
    engine.notifySessionSwitch()
    expect(composer.classList.contains(styleClass('reveal'))).toBe(false)
    const hero = document.createElement('div')
    composer.appendChild(hero)
    await flushObserver()
    expect(composer.classList.contains(styleClass('reveal'))).toBe(true)
    // The transcript panel still re-enters through the delayed replay.
    await waitReplay()
    expect(flow.classList.contains(PANEL_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('fades the composer seat in the chosen new-chat style', async () => {
    const { options } = harness({ blank: true, newChatStyle: 'bloom' })
    const engine = installConversationEntrance(options)
    const composer = document.createElement('div')
    composer.setAttribute('data-composer-seat', '')
    document.body.appendChild(composer)
    const flow = document.createElement('div')
    flow.setAttribute('data-chat-flow', '')
    document.body.appendChild(flow)
    await flushObserver()

    engine.notifySessionSwitch()
    expect(composer.classList.contains(styleClass('bloom'))).toBe(false)
    const hero = document.createElement('div')
    composer.appendChild(hero)
    await flushObserver()
    expect(composer.classList.contains(styleClass('bloom'))).toBe(true)
    expect(composer.classList.contains(PANEL_ANIMATION_CLASS)).toBe(false)
    engine.dispose()
  })

  it('does not fade the composer seat on ordinary switches (transcript present)', async () => {
    const { options } = harness({ blank: false })
    const engine = installConversationEntrance(options)
    const composer = document.createElement('div')
    composer.setAttribute('data-composer-seat', '')
    document.body.appendChild(composer)
    const flow = document.createElement('div')
    flow.setAttribute('data-chat-flow', '')
    document.body.appendChild(flow)
    const row = makeRow('k1')
    flow.appendChild(row)
    await flushObserver()

    engine.notifySessionSwitch()
    await waitReplay()
    expect(composer.classList.contains(PANEL_ANIMATION_CLASS)).toBe(false)
    expect(flow.classList.contains(PANEL_ANIMATION_CLASS)).toBe(true)
    engine.dispose()
  })

  it('keeps the composer seat still on a blank=false switch mid-load', async () => {
    // Session switched but its transcript has not mounted yet: rows are
    // empty, yet this is NOT a new conversation — the seat must not animate.
    const { options } = harness({ blank: false })
    const engine = installConversationEntrance(options)
    const composer = document.createElement('div')
    composer.setAttribute('data-composer-seat', '')
    document.body.appendChild(composer)
    const flow = document.createElement('div')
    flow.setAttribute('data-chat-flow', '')
    document.body.appendChild(flow)
    await flushObserver()

    engine.notifySessionSwitch()
    await waitReplay()
    expect(composer.classList.contains(PANEL_ANIMATION_CLASS)).toBe(false)
    engine.dispose()
  })

  it('does not animate the panel while disabled', async () => {
    const { options, setState } = harness()
    const engine = installConversationEntrance(options)
    const column = document.createElement('div')
    column.setAttribute('data-chat-flow', '')
    document.body.appendChild(column)
    const row = makeRow('k1')
    column.appendChild(row)
    await flushObserver()
    setState({ transcript: false, sidebar: false, selection: false, newChat: false })

    engine.notifySessionSwitch()
    await waitReplay()
    expect(column.classList.contains(PANEL_ANIMATION_CLASS)).toBe(false)
    engine.dispose()
  })
})
