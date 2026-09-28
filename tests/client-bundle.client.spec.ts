// @vitest-environment jsdom
/**
 * Client-bundle load regression (issue #4): `lib/client.js` must load under a
 * DSH 0.1.2-style module table — one where `@deepseek-ai/dsh-client-runtime`
 * is absent and requiring it throws exactly like the host reported
 * ("missed the module table"). The pre-fix bundle required that package at the
 * top of its factory and died before any code ran; the fixed bundle must
 * execute fully and export its surface. CSS-module regions also run at
 * factory time, so the injected style tags double as an execution signal.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REAL_EXTERNAL_IDS = ['react', 'react-dom', 'react/jsx-runtime'] as const
/** Browser-side host modules: stubbed — the factory only needs bindings to exist. */
const STUBBED_EXTERNAL_IDS = [
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
] as const

const RETIRED_IDS = [/^@deepseek-ai\/dsh-client-runtime/]

interface LoadCall {
  id: string
  factory: (require: (id: string) => unknown) => unknown
}

/** Callable, nestable, stringifies safely — stands in for any host export. */
function anyStub(): unknown {
  const stub = (): null => null
  return new Proxy(stub, {
    get: (target, prop) => {
      if (prop === Symbol.toPrimitive) return () => 'stub'
      if (prop === 'toString') return () => 'stub'
      if (prop === 'then') return undefined
      return anyStub()
    },
  })
}

async function loadBundle(): Promise<LoadCall[]> {
  const loads: LoadCall[] = []
  ;(window as unknown as { __ModuleLoader__: { load: (call: LoadCall) => void } }).__ModuleLoader__ = {
    load: (call) => loads.push(call),
  }
  const bundlePath = resolve(process.cwd(), 'lib/client.js')
  // eslint-disable-next-line no-eval -- executing the built artifact is the test
  eval(readFileSync(bundlePath, 'utf8'))
  return loads
}

async function dsh012Require(): Promise<(id: string) => unknown> {
  const table = new Map<string, unknown>()
  for (const id of REAL_EXTERNAL_IDS) table.set(id, await import(id))
  for (const id of STUBBED_EXTERNAL_IDS) table.set(id, anyStub())
  return (id: string) => {
    if (RETIRED_IDS.some((re) => re.test(id))) {
      throw new Error(
        `require("${id}") missed the module table — not a platform seed word, not a materialized module, and no registered package factory`,
      )
    }
    const mod = table.get(id)
    if (mod === undefined) throw new Error(`unexpected require("${id}") in client bundle`)
    return mod
  }
}

describe('lib/client.js under a DSH 0.1.2-style module table', () => {
  it('registers itself with the loader under the package id', async () => {
    const loads = await loadBundle()
    expect(loads).toHaveLength(1)
    expect(loads[0]!.id).toBe('@ha-na-bi/dsh-client-ui-custom')
    expect(typeof loads[0]!.factory).toBe('function')
  })

  it('executes the factory without the retired runtime package and exports its surface', async () => {
    const loads = await loadBundle()
    const require = await dsh012Require()
    const exports = loads[0]!.factory(require) as Record<string, unknown>
    // the public surface of src/client/index.ts, pinned so accidental export
    // drops surface here rather than at a DSH host
    for (const name of [
      'apply',
      'buildShortcutMap',
      'cycleThinking',
      'inject',
      'keyToToken',
      'matchesKeyCombo',
      'modelCatalogOptions',
      'newConversation',
      'normalizeConfig',
      'parseKeyCombo',
      'resolveFeatures',
      'resolvePreset',
      'selectModelDirect',
      'specFromEvent',
      'switchModel',
    ]) {
      expect(exports[name], `export ${name}`).toBeDefined()
    }
  })

  it('injects its CSS modules as tagged style elements during load', async () => {
    document.head.innerHTML = ''
    const loads = await loadBundle()
    loads[0]!.factory(await dsh012Require())
    const tags = document.head.querySelectorAll('style[data-plugin-css]')
    expect(tags.length).toBeGreaterThan(0)
    for (const tag of tags) {
      expect(tag.getAttribute('data-plugin-css')).toMatch(/^@ha-na-bi\/dsh-client-ui-custom\//)
      expect(tag.textContent).not.toBe('')
    }
  })
})
