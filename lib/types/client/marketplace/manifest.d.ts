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
    id: string;
    /** npm package name (the roster row's `name`). */
    package: string;
    /** Display name. */
    name: string;
    /** One-line description. */
    description: string;
    /** GitHub jump link (repo or source path). */
    repoUrl: string;
    /** The `- insert:` YAML snippet that installs the plugin. */
    installYaml: string;
    /**
     * Sort metadata from GitHub: stars and publish date. Populated by
     * fetchRepoEntry / discoverGitHubPlugins / enrichEntryMetadata; a
     * manifest-file entry carries none until enriched.
     */
    stars?: number;
    /** ISO publish date (the repo's `created_at`). */
    createdAt?: string;
}
/** Build the install snippet for one package. */
export declare function installSnippet(id: string, pkg: string): string;
/**
 * The bundled catalog: empty by design. Built-ins ship in the roster already;
 * third-party plugins arrive through the configured sources and the GitHub
 * discovery search (see deriveMarketplaceSources / discoverGitHubPlugins).
 */
export declare const BUNDLED_MARKETPLACE: readonly MarketplaceEntry[];
/**
 * Default remote manifest URL (GitHub raw; CORS-open). Points at the
 * deepseek-harness `master` branch — the repo's default branch — where the
 * manifest lives once published. A profile without an explicit
 * `marketplaceUrl` shows this source's failure in the UI (instead of silently
 * rendering an empty market), so the missing manifest is diagnosable.
 */
export declare const DEFAULT_MARKETPLACE_URL = "https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-custom/marketplace.json";
/** One configured marketplace source. */
export type MarketplaceSource = 
/** A raw manifest JSON URL (or any http(s) URL) fetched verbatim. */
{
    kind: 'manifest';
    url: string;
    label: string;
}
/** A GitHub repo: probed for marketplace.json, then resolved from metadata. */
 | {
    kind: 'repo';
    owner: string;
    repo: string;
    probes: string[];
    label: string;
};
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
export declare function deriveMarketplaceSources(setting: string | undefined): MarketplaceSource[];
/** Validate a raw manifest payload leniently. */
export declare function parseMarketplaceManifest(value: unknown): MarketplaceEntry[] | null;
/** Why a manifest fetch did not produce entries. */
export type MarketplaceFetchFailure = {
    code: 'network';
} | {
    code: 'http';
    status: number;
} | {
    code: 'invalid';
};
/** The outcome of fetching one source. */
export type MarketplaceFetchResult = {
    ok: true;
    entries: MarketplaceEntry[];
} | {
    ok: false;
    failure: MarketplaceFetchFailure;
};
/** Fetch one manifest URL and classify the outcome. */
export declare function fetchMarketplaceManifest(url: string): Promise<MarketplaceFetchResult>;
/**
 * Resolve a GitHub repo into a marketplace entry from its metadata: the repos
 * endpoint provides the description, and the contents endpoint provides the
 * real npm package name (best-effort — a missing package.json degrades to
 * `@owner/repo`). Fails only when the repo itself is unreachable.
 * @param owner - the repo owner.
 * @param repo - the repo name.
 * @returns one entry, or a categorized failure.
 */
export declare function fetchRepoEntry(owner: string, repo: string): Promise<MarketplaceFetchResult>;
/** The outcome of the GitHub auto-discovery search. */
export type MarketplaceDiscoveryResult = {
    ok: true;
    entries: MarketplaceEntry[];
    total: number;
} | {
    ok: false;
    failure: MarketplaceFetchFailure;
};
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
export declare function discoverGitHubPlugins(sort: 'stars' | 'date', limit: number): Promise<MarketplaceDiscoveryResult>;
/**
 * Best-effort: fill in `stars` / `createdAt` for entries that came from a
 * plain manifest (they carry a repo URL but no sort metadata), so the whole
 * merged list can be sorted by stars or by publish date. Entries already
 * carrying metadata (repo sources / discovery) and non-repo URLs are skipped;
 * failures are silent — the entry just sorts to the end.
 * @param entries - the merged entry list (mutated in place).
 */
export declare function enrichEntryMetadata(entries: readonly MarketplaceEntry[]): Promise<void>;
//# sourceMappingURL=manifest.d.ts.map