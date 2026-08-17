// @vitest-environment node
/**
 * ui-custom plugin-marketplace manifest (manifest.ts): install-snippet
 * generation and lenient remote-manifest parsing.
 */
import { describe, expect, it } from 'vitest'
import {
  BUNDLED_MARKETPLACE, installSnippet, parseMarketplaceManifest,
} from '../src/client/marketplace/manifest.ts'

describe('installSnippet', () => {
  it('builds the insert YAML for a plugin', () => {
    expect(installSnippet('ui-custom', '@ha-na-bi/dsh-client-ui-custom')).toBe(
      "- insert:\n    - id: ui-custom\n      name: '@ha-na-bi/dsh-client-ui-custom'",
    )
  })
})

describe('BUNDLED_MARKETPLACE', () => {
  it('ships empty — built-ins are not marketplace items; the catalog comes from the remote GitHub manifest', () => {
    expect(BUNDLED_MARKETPLACE).toHaveLength(0)
  })
})

describe('parseMarketplaceManifest', () => {
  it('parses a valid manifest and synthesizes install snippets', () => {
    const parsed = parseMarketplaceManifest([
      { id: 'a', package: '@deepseek-ai/x', name: 'X', description: 'desc', repoUrl: 'https://github.com/a/b' },
      { id: 'b', package: '@deepseek-ai/y', name: 'Y', description: 'desc2' },
    ])
    expect(parsed).not.toBeNull()
    expect(parsed).toHaveLength(2)
    expect(parsed![0]!.installYaml).toContain('@deepseek-ai/x')
    expect(parsed![1]!.installYaml).toBe(installSnippet('b', '@deepseek-ai/y'))
    expect(parsed![1]!.repoUrl).toBe('')
  })

  it('rejects empty, non-array, or all-invalid payloads', () => {
    expect(parseMarketplaceManifest([])).toBeNull()
    expect(parseMarketplaceManifest({})).toBeNull()
    expect(parseMarketplaceManifest([{ id: 1 }])).toBeNull()
    expect(parseMarketplaceManifest('nope')).toBeNull()
  })

  it('drops invalid rows but keeps valid ones', () => {
    const parsed = parseMarketplaceManifest([
      null,
      { id: 'ok', package: '@deepseek-ai/ok', name: 'OK', description: 'd' },
      { id: 'bad' },
    ])
    expect(parsed).not.toBeNull()
    expect(parsed).toHaveLength(1)
    expect(parsed![0]!.id).toBe('ok')
  })
})
