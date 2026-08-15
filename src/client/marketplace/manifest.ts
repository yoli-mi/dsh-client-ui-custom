/**
 * Plugin marketplace manifest: DSH plugins discovered from GitHub.
 *
 * The marketplace lists THIRD-PARTY plugins only — DSH's built-in packages
 * already ship in the web roster and are not "marketplace" items. Entries come
 * from three places, merged in order (first occurrence of an id wins):
 *   1. configured manifest sources (`marketplaceUrl`): raw JSON manifests;
 *   2. configured GitHub repo URLs: each repo is probed for its
 *      `marketplace.json` on `main`/`master`, falling back to its GitHub
 *      metadata (description + package.json) when neither exists;
 *   3. GitHub auto-discovery: repos tagged `dsh-plugin` with a `dsh-` name
 *      prefix, sorted by stars.
 * Each entry carries a GitHub jump link and the exact `- insert:` YAML a
 * one-click install pastes into the watched profile patch file.
 */

/** One marketplace entry. */
export interface MarketplaceEntry {
  /** Plugin id used in the roster row (and the settings entry id). */
  id: string
  /** npm package name (the roster row's `name`). */
  package: string
  /** Display name. */
  name: string
  /** One-line description. */
  description: string
  /** GitHub jump link (repo or source path). */
  repoUrl: string
  /** The `- insert:` YAML snippet that installs the plugin. */
  installYaml: string
  /**
   * Sort metadata from GitHub: stars and publish date. Populated by
   * fetchRepoEntry / discoverGitHubPlugins / enrichEntryMetadata; a
   * manifest-file entry carries none until enriched.
   */
  stars?: number
  /** ISO publish date (the repo's `created_at`). */
  createdAt?: string
}

/** Build the install snippet for one package. */
export function installSnippet(id: string, pkg: string): string {
  return [
    '- insert:',
    `    - id: ${id}`,
    `      name: '${pkg}'`,
  ].join('\n')
}

/**
 * The bundled catalog: empty by design. Built-ins ship in the roster already;
 * third-party plugins arrive through the configured sources and the GitHub
 * discovery search (see deriveMarketplaceSources / discoverGitHubPlugins).
 */
export const BUNDLED_MARKETPLACE: readonly MarketplaceEntry[] = []

/**
 * Default remote manifest URL (GitHub raw; CORS-open). Points at the
 * deepseek-harness `master` branch — the repo's default branch — where the
 * manifest lives once published. A profile without an explicit
 * `marketplaceUrl` shows this source's failure in the UI (instead of silently
 * rendering an empty market), so the missing manifest is diagnosable.
 */
export const DEFAULT_MARKETPLACE_URL =
  'https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-custom/marketplace.json'

/** GitHub REST API base (CORS-open; used for repo fallback + discovery). */
const GITHUB_API = 'https://api.github.com'

/** One configured marketplace source. */
export type MarketplaceSource =
  /** A raw manifest JSON URL (or any http(s) URL) fetched verbatim. */
  | { kind: 'manifest'; url: string; label: string }
  /** A GitHub repo: probed for marketplace.json, then resolved from metadata. */
  | { kind: 'repo'; owner: string; repo: string; probes: string[]; label: string }

/** Raw-manifest candidates for a GitHub repo on the usual default branches. */
const DEFAULT_BRANCHES = ['main', 'master'] as const

/** Derive raw-manifest URL(s) from a GitHub repo path (`owner/repo`). */
function githubRepoRawCandidates(owner: string, repo: string): string[] {
  const clean = repo.replace(/\.git$/, '').replace(/\/+$/, '')
  return DEFAULT_BRANCHES.map((branch) =>
    `https://raw.githubusercontent.com/${owner}/${clean}/${branch}/marketplace.json`)
}

/**
 * Normalize a `marketplaceUrl` settings value into a flat list of sources.
 * Pure: no DOM, no fetch.
 *
 * Accepted shapes, separated by commas / semicolons / whitespace / newlines
 * (both ASCII and full-width separators):
 *   - a raw manifest URL (`https://raw.githubusercontent.com/…/marketplace.json`)
 *     or any other http(s) URL — a manifest source used as-is;
 *   - a GitHub repo URL (`https://github.com/owner/repo`) — a repo source,
 *     probed for its `marketplace.json` on `main` then `master`, then resolved
 *     from GitHub metadata;
 *   - a GitHub blob URL (`…/blob/<branch>/<path>`) — mapped to the raw URL.
 *
 * Unknown or malformed entries are dropped; duplicates are removed (first
 * occurrence wins).
 * @param setting - the raw marketplaceUrl setting ('' / undefined → no sources).
 * @returns sources, in configured order.
 */
export function deriveMarketplaceSources(setting: string | undefined): MarketplaceSource[] {
  const out: MarketplaceSource[] = []
  const seen = new Set<string>()
  const push = (source: MarketplaceSource): void => {
    if (seen.has(source.label)) return
    seen.add(source.label)
    out.push(source)
  }
  if (typeof setting !== 'string' || setting.trim() === '') return out
  const parts = setting.split(/[\s,;，；]+/).map((part) => part.trim()).filter((part) => part !== '')
  for (const part of parts) {
    // GitHub blob URL → the same file on raw.githubusercontent.com.
    // Checked before the repo pattern: the repo form also matches any
    // `github.com/owner/repo/…` path, so a blob URL must win as the file it is.
    const blob = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)\/blob\/([^/\s]+)\/(.+)$/.exec(part)
    if (blob !== null && blob[1] !== undefined && blob[2] !== undefined && blob[3] !== undefined && blob[4] !== undefined) {
      push({
        kind: 'manifest',
        url: `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}/${blob[4]}`,
        label: part,
      })
      continue
    }
    // GitHub repo root (optional scheme/www, optional trailing path ignored) →
    // probe main/master for marketplace.json, then resolve from metadata.
    const repo = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\/.*)?$/.exec(part)
    if (repo !== null && repo[1] !== undefined && repo[2] !== undefined) {
      push({
        kind: 'repo',
        owner: repo[1],
        repo: repo[2],
        probes: githubRepoRawCandidates(repo[1], repo[2]),
        label: `github.com/${repo[1]}/${repo[2]}`,
      })
      continue
    }
    // Any other http(s) URL is taken verbatim as a manifest source.
    if (/^https?:\/\//.test(part)) push({ kind: 'manifest', url: part, label: part })
  }
  return out
}

/** Validate a raw manifest payload leniently. */
export function parseMarketplaceManifest(value: unknown): MarketplaceEntry[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const entries: MarketplaceEntry[] = []
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) continue
    const entry = raw as Partial<MarketplaceEntry>
    if (typeof entry.id !== 'string' || typeof entry.package !== 'string') continue
    if (typeof entry.name !== 'string' || typeof entry.description !== 'string') continue
    entries.push({
      id: entry.id,
      package: entry.package,
      name: entry.name,
      description: entry.description,
      repoUrl: typeof entry.repoUrl === 'string' ? entry.repoUrl : '',
      installYaml: typeof entry.installYaml === 'string'
        ? entry.installYaml
        : installSnippet(entry.id, entry.package),
    })
  }
  return entries.length === 0 ? null : entries
}

/** Why a manifest fetch did not produce entries. */
export type MarketplaceFetchFailure =
  | { code: 'network' }
  | { code: 'http'; status: number }
  | { code: 'invalid' }

/** The outcome of fetching one source. */
export type MarketplaceFetchResult =
  | { ok: true; entries: MarketplaceEntry[] }
  | { ok: false; failure: MarketplaceFetchFailure }

/** Fetch one manifest URL and classify the outcome. */
export async function fetchMarketplaceManifest(url: string): Promise<MarketplaceFetchResult> {
  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    return { ok: false, failure: { code: 'network' } }
  }
  if (!response.ok) return { ok: false, failure: { code: 'http', status: response.status } }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { ok: false, failure: { code: 'invalid' } }
  }
  const entries = parseMarketplaceManifest(payload)
  if (entries === null) return { ok: false, failure: { code: 'invalid' } }
  return { ok: true, entries }
}

/** One entry built from a GitHub repo, with a best-effort package name. */
function repoEntry(owner: string, repo: string, packageName: string, description: string, htmlUrl: string, stars?: number, createdAt?: string): MarketplaceEntry {
  const clean = repo.replace(/\.git$/, '').replace(/\/+$/, '')
  const pkg = packageName !== '' ? packageName : `@${owner}/${clean}`
  return {
    id: clean,
    package: pkg,
    name: `${owner}/${clean}`,
    description,
    repoUrl: htmlUrl,
    installYaml: installSnippet(clean, pkg),
    ...(stars !== undefined ? { stars } : {}),
    ...(createdAt !== undefined ? { createdAt } : {}),
  }
}

/**
 * Resolve a GitHub repo into a marketplace entry from its metadata: the repos
 * endpoint provides the description, and the contents endpoint provides the
 * real npm package name (best-effort — a missing package.json degrades to
 * `@owner/repo`). Fails only when the repo itself is unreachable.
 * @param owner - the repo owner.
 * @param repo - the repo name.
 * @returns one entry, or a categorized failure.
 */
export async function fetchRepoEntry(owner: string, repo: string): Promise<MarketplaceFetchResult> {
  const clean = repo.replace(/\.git$/, '').replace(/\/+$/, '')
  let metadata: { description?: string; html_url?: string; stargazers_count?: unknown; created_at?: unknown }
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${clean}`, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) return { ok: false, failure: { code: 'http', status: response.status } }
    metadata = await response.json() as { description?: string; html_url?: string; stargazers_count?: unknown; created_at?: unknown }
  } catch {
    return { ok: false, failure: { code: 'network' } }
  }
  // Best-effort real package name from the repo's package.json.
  let packageName = ''
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${clean}/contents/package.json`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (response.ok) {
      const payload = await response.json() as { content?: string }
      if (typeof payload.content === 'string') {
        const text = atob(payload.content.replace(/\s/g, ''))
        const manifest = JSON.parse(text) as { name?: unknown }
        if (typeof manifest.name === 'string' && manifest.name !== '') packageName = manifest.name
      }
    }
  } catch {
    // package.json is optional; the @owner/repo fallback stands.
  }
  return {
    ok: true,
    entries: [repoEntry(
      owner, clean, packageName, metadata.description ?? '',
      metadata.html_url ?? `https://github.com/${owner}/${clean}`,
      typeof metadata.stargazers_count === 'number' ? metadata.stargazers_count : undefined,
      typeof metadata.created_at === 'string' ? metadata.created_at : undefined,
    )],
  }
}

/** The GitHub search query for the auto-discovery source (dsh-plugin topic + dsh- name). */
const DISCOVERY_QUERY = 'topic:dsh-plugin dsh- in:name'

/**
 * Repo names (lowercase) that are index / aggregator / docs pages rather than
 * installable plugins. The name check also drops every `awesome` list (the
 * GitHub query cannot reliably exclude them). Explicitly configured sources
 * (manifest entries / repo URLs) are never filtered.
 */
const DISCOVERY_EXCLUDED_NAMES = new Set([
  'dsh-hub', 'dsh-suite', 'dsh-recommend', 'dsh-plugin-marketplace', 'dsh-plugin-hub',
  'dsh-handbook', 'dsh-market',
])

/** Whether a discovered repo name should be skipped (index/aggregator repos). */
function isExcludedDiscoveryRepo(name: string): boolean {
  const lower = name.toLowerCase()
  if (lower.includes('awesome')) return true
  return DISCOVERY_EXCLUDED_NAMES.has(lower)
}

/** The outcome of the GitHub auto-discovery search. */
export type MarketplaceDiscoveryResult =
  | { ok: true; entries: MarketplaceEntry[]; total: number }
  | { ok: false; failure: MarketplaceFetchFailure }

/**
 * Auto-discover third-party plugins from GitHub: repos tagged with the
 * `dsh-plugin` topic and a `dsh-` name prefix. The GitHub search sorts
 * natively by stars or by recency (`updated`); for the `date` mode the page is
 * re-sorted by the repo's publish date (`created_at`, newest first) before the
 * limit is applied. The response's `total_count` rides along so the tab can
 * show how many plugins exist on GitHub. Classified failures keep the UI
 * honest (network / HTTP status / invalid shape).
 * @param sort - 'stars' (default) or 'date' (publish date, recent first).
 * @param limit - how many entries to return (clamped to 1–100).
 * @returns discovered entries + the GitHub total, or a categorized failure.
 */
export async function discoverGitHubPlugins(sort: 'stars' | 'date', limit: number): Promise<MarketplaceDiscoveryResult> {
  const count = Math.min(100, Math.max(1, Math.round(limit)))
  const order = sort === 'date' ? 'updated' : 'stars'
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(DISCOVERY_QUERY)}&sort=${order}&order=desc&per_page=${count}`
  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  } catch {
    return { ok: false, failure: { code: 'network' } }
  }
  if (!response.ok) return { ok: false, failure: { code: 'http', status: response.status } }
  let payload: { total_count?: unknown; items?: unknown }
  try {
    payload = await response.json() as { total_count?: unknown; items?: unknown }
  } catch {
    return { ok: false, failure: { code: 'invalid' } }
  }
  if (!Array.isArray(payload.items)) return { ok: false, failure: { code: 'invalid' } }
  const total = typeof payload.total_count === 'number' && Number.isFinite(payload.total_count) ? payload.total_count : 0
  interface SearchItem { full_name?: unknown; name?: unknown; description?: unknown; html_url?: unknown; created_at?: unknown; stargazers_count?: unknown }
  const items = payload.items.filter((raw): raw is SearchItem => typeof raw === 'object' && raw !== null)
  if (sort === 'date') {
    items.sort((a, b) => (typeof b.created_at === 'string' ? b.created_at : '').localeCompare(typeof a.created_at === 'string' ? a.created_at : ''))
  }
  const entries: MarketplaceEntry[] = []
  for (const item of items.slice(0, count)) {
    const fullName = typeof item.full_name === 'string' ? item.full_name : ''
    const name = typeof item.name === 'string' ? item.name : ''
    if (fullName === '' || name === '') continue
    if (isExcludedDiscoveryRepo(name)) continue
    const separator = fullName.indexOf('/')
    const owner = separator > 0 ? fullName.slice(0, separator) : ''
    if (owner === '') continue
    entries.push(repoEntry(
      owner, name, '', typeof item.description === 'string' ? item.description : '',
      typeof item.html_url === 'string' ? item.html_url : `https://github.com/${fullName}`,
      typeof item.stargazers_count === 'number' ? item.stargazers_count : undefined,
      typeof item.created_at === 'string' ? item.created_at : undefined,
    ))
  }
  if (entries.length === 0) return { ok: false, failure: { code: 'invalid' } }
  return { ok: true, entries, total }
}

/** A `github.com/owner/repo` URL (the repo root form, trailing path ignored). */
const GITHUB_REPO_URL = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\/|$)/
/** Cap on metadata-enrichment calls per refresh (GitHub API rate-limit courtesy). */
const ENRICH_LIMIT = 8

/**
 * Best-effort: fill in `stars` / `createdAt` for entries that came from a
 * plain manifest (they carry a repo URL but no sort metadata), so the whole
 * merged list can be sorted by stars or by publish date. Entries already
 * carrying metadata (repo sources / discovery) and non-repo URLs are skipped;
 * failures are silent — the entry just sorts to the end.
 * @param entries - the merged entry list (mutated in place).
 */
export async function enrichEntryMetadata(entries: readonly MarketplaceEntry[]): Promise<void> {
  const targets = entries.filter((entry) =>
    entry.stars === undefined && entry.createdAt === undefined && GITHUB_REPO_URL.test(entry.repoUrl))
    .slice(0, ENRICH_LIMIT)
  await Promise.allSettled(targets.map(async (entry) => {
    const match = GITHUB_REPO_URL.exec(entry.repoUrl)
    if (match === null || match[1] === undefined || match[2] === undefined) return
    try {
      const response = await fetch(`${GITHUB_API}/repos/${match[1]}/${match[2]}`, { headers: { Accept: 'application/vnd.github+json' } })
      if (!response.ok) return
      const meta = await response.json() as { stargazers_count?: unknown; created_at?: unknown }
      if (typeof meta.stargazers_count === 'number') entry.stars = meta.stargazers_count
      if (typeof meta.created_at === 'string') entry.createdAt = meta.created_at
    } catch {
      // enrichment is best-effort; the entry sorts by fallback keys.
    }
  }))
}
