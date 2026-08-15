// @vitest-environment jsdom
/**
 * ui-custom history: turn building from the mounted Chat snapshot (question
 * preview + turn start time), the current-turn picker for the accent
 * highlight, relative-time formatting, and DOM anchor lookup for the jump.
 */
import { describe, expect, it } from 'vitest'
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import {
  buildTurns, currentTurnKey, findAnchorRow, formatRelativeTime, mergeVisibleTurns, previewOfNode,
  type HistoryTurn,
} from '../src/client/history/turns.ts'

interface FakeNode {
  key: string
  kind: string
  data: unknown
  location?: unknown
}

const node = (key: string, kind: string, data: unknown, location?: unknown): FakeNode => ({ key, kind, data, location })

const userText = (text: string): unknown => ({ content: [{ type: 'text', text }] })
const assistantText = (text: string): unknown => ({ blocks: [{ kind: 'text', text }] })

/** A turn location (the shape the engine attaches to user/steering nodes). */
const inTurn = (turn: number): unknown => ({ kind: 'turn', turn: { turn } })

/** Minimal ChatSnapshot fixture; node payloads mirror the runtime shapes. */
function snapshot(
  entries: FakeNode[],
  turnTimings: Map<number, { startTime: number; endTime?: number }> = new Map(),
): ChatSnapshot {
  const map = new Map(entries.map(n => [n.key, n]))
  return {
    order: entries.map(n => n.key),
    nodes: { get: (key: string) => map.get(key), values: () => entries },
    locations: { getTurn: () => [], getStep: () => [] },
    timeline: { turnOrder: [], turns: new Map() },
    legacy: {
      nodes: [], turnTimings, turnEnds: new Map(), partial: null, runningCalls: [],
    },
  } as unknown as ChatSnapshot
}

const zhTime = {
  justNow: '刚刚', minutes: '{n} 分钟前', hours: '{n} 小时前', days: '{n} 天前', date: '{m}月{d}日',
}

describe('previewOfNode', () => {
  it('reads user/steering content text blocks', () => {
    expect(previewOfNode('user', userText('hello world'))).toBe('hello world')
    expect(previewOfNode('steering', userText('   spaced   out  '))).toBe('spaced out')
  })

  it('reads assistant text blocks', () => {
    expect(previewOfNode('assistant', assistantText('the answer'))).toBe('the answer')
  })

  it('ignores non-text blocks and non-message kinds', () => {
    expect(previewOfNode('user', { content: [{ type: 'image', attachment: {} }] })).toBe('')
    expect(previewOfNode('assistant', { blocks: [{ kind: 'tool-call', callId: 'c1' }] })).toBe('')
    expect(previewOfNode('turn-tail', { whatever: 1 })).toBe('')
    expect(previewOfNode('user', null)).toBe('')
  })
})

describe('buildTurns', () => {
  it('builds one row per user turn with the turn start time', () => {
    const timings = new Map([
      [1, { startTime: 1000 }],
      [2, { startTime: 5000 }],
    ])
    const turns = buildTurns(snapshot([
      node('u1', 'user', userText('first question'), inTurn(1)),
      node('a1', 'assistant', assistantText('reply')),
      node('u2', 'user', userText('second question'), inTurn(2)),
      node('a2', 'assistant', assistantText('reply 2')),
    ], timings))
    expect(turns).toEqual([
      { key: 'u1', index: 1, question: 'first question', time: 1000, turn: 1 },
      { key: 'u2', index: 2, question: 'second question', time: 5000, turn: 2 },
    ])
  })

  it('treats steering messages as turns too', () => {
    const turns = buildTurns(snapshot([
      node('s1', 'steering', userText('mid-turn question'), inTurn(1)),
      node('a1', 'assistant', assistantText('reply')),
    ]))
    expect(turns).toHaveLength(1)
    expect(turns[0]?.key).toBe('s1')
  })

  it('leaves time undefined when the turn timing is unavailable', () => {
    const turns = buildTurns(snapshot([node('u1', 'user', userText('q'), inTurn(9))]))
    expect(turns[0]?.time).toBeUndefined()
    // No location at all → still listed, time undefined.
    const bare = buildTurns(snapshot([node('u1', 'user', userText('q'))]))
    expect(bare[0]?.time).toBeUndefined()
    expect(bare[0]?.question).toBe('q')
  })

  it('skips non-message kinds and returns [] for an empty chat', () => {
    expect(buildTurns(snapshot([
      node('t1', 'turn-tail', { turn: 1 }),
      node('c1', 'compaction', { commandId: 'x' }),
      node('a1', 'assistant', assistantText('no question before it')),
    ]))).toEqual([])
    expect(buildTurns(snapshot([]))).toEqual([])
  })

  it('is keyed by the engine node key (opaque jump anchors)', () => {
    const turns = buildTurns(snapshot([node('u:7', 'user', userText('q'), inTurn(1))]))
    expect(turns[0]?.key).toBe('u:7')
  })
})

describe('mergeVisibleTurns', () => {
  const numbered = (count: number): HistoryTurn[] => Array.from({ length: count }, (_, i) => ({
    key: `u${i + 1}`, index: i + 1, question: '', time: undefined, turn: i + 1,
  }))

  it('applies the limit to non-pinned turns', () => {
    const turns = numbered(10)
    expect(mergeVisibleTurns(turns, 3, new Set())).toEqual(turns.slice(7))
  })

  it('keeps pinned turns regardless of the limit, in natural order', () => {
    const turns = numbered(10)
    const merged = mergeVisibleTurns(turns, 3, new Set([1, 5]))
    expect(merged.map(turn => turn.turn)).toEqual([1, 5, 8, 9, 10])
  })

  it('shows every turn for a zero limit', () => {
    const turns = numbered(4)
    expect(mergeVisibleTurns(turns, 0, new Set([2]))).toEqual(turns)
  })

  it('treats turns without a number as non-pinned', () => {
    const turns = numbered(3).map(turn => ({ ...turn, turn: undefined }))
    expect(mergeVisibleTurns(turns, 1, new Set([1]))).toEqual([turns[2]])
  })
})

describe('currentTurnKey', () => {
  const host = document.createElement('div')
  host.innerHTML = [
    '<div data-chat-anchor-key="u:1">one</div>',
    '<div data-chat-anchor-key="u:2">two</div>',
    '<div data-chat-anchor-key="u:3">three</div>',
  ].join('')
  document.body.appendChild(host)

  const rows = [...document.querySelectorAll<HTMLElement>('[data-chat-anchor-key]')]
  const place = (key: string, top: number): void => {
    const row = rows.find(row => row.dataset.chatAnchorKey === key)
    expect(row).toBeTruthy()
    row!.getBoundingClientRect = () => ({
      top, bottom: top + 40, left: 0, right: 0, width: 0, height: 40,
      x: 0, y: top, toJSON: () => ({}),
    }) as DOMRect
  }

  it('picks the last turn that scrolled past the reading offset', () => {
    place('u:1', -800)
    place('u:2', -200)
    place('u:3', 600)
    expect(currentTurnKey(['u:1', 'u:2', 'u:3'])).toBe('u:2')
  })

  it('highlights the first turn at the top of the conversation', () => {
    place('u:1', 20)
    place('u:2', 400)
    place('u:3', 900)
    expect(currentTurnKey(['u:1', 'u:2', 'u:3'])).toBe('u:1')
  })

  it('falls back to the topmost row when none reached the offset', () => {
    place('u:1', 300)
    place('u:2', 500)
    place('u:3', 700)
    expect(currentTurnKey(['u:1', 'u:2', 'u:3'])).toBe('u:1')
  })

  it('always highlights the last turn at the bottom of the conversation', () => {
    place('u:1', -4000)
    place('u:2', -2000)
    place('u:3', -500)
    expect(currentTurnKey(['u:1', 'u:2', 'u:3'])).toBe('u:3')
  })

  it('ignores keys without a mounted row', () => {
    expect(currentTurnKey(['ghost'])).toBeNull()
  })
})

describe('formatRelativeTime', () => {
  const now = 1_000_000_000_000

  it('formats the localized buckets', () => {
    expect(formatRelativeTime(now - 10_000, zhTime, now)).toBe('刚刚')
    expect(formatRelativeTime(now - 3 * 60_000, zhTime, now)).toBe('3 分钟前')
    expect(formatRelativeTime(now - 5 * 3_600_000, zhTime, now)).toBe('5 小时前')
    expect(formatRelativeTime(now - 2 * 86_400_000, zhTime, now)).toBe('2 天前')
  })

  it('shows the date for anything older than a week', () => {
    const date = new Date(now - 40 * 86_400_000)
    const expected = `${date.getMonth() + 1}月${date.getDate()}日`
    expect(formatRelativeTime(now - 40 * 86_400_000, zhTime, now)).toBe(expected)
  })
})

describe('findAnchorRow', () => {
  it('locates a mounted row by its data-chat-anchor-key', () => {
    const host = document.createElement('div')
    host.innerHTML = '<div data-chat-anchor-key="u:1">one</div><div data-chat-anchor-key="u:2">two</div>'
    document.body.appendChild(host)
    try {
      expect(findAnchorRow('u:2')?.textContent).toBe('two')
      expect(findAnchorRow('u:1')?.textContent).toBe('one')
      expect(findAnchorRow('missing')).toBeNull()
    } finally {
      host.remove()
    }
  })
})
