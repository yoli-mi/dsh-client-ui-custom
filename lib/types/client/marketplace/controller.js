/**
 * Plugin-marketplace controller: multi-source catalog refresh + GitHub
 * auto-discovery + installed-state projection + one-click install (copies the
 * insert YAML). Sources come from the `marketplaceUrl` settings field (see
 * deriveMarketplaceSources): raw manifests are fetched verbatim, GitHub repo
 * URLs are probed for `marketplace.json` and fall back to their repo metadata.
 * Discovery merges the top-starred `dsh-plugin` topic repos afterwards. If
 * every source fails, the failure is recorded per source so the tab can show
 * why instead of rendering a silent empty market.
 */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import { BUNDLED_MARKETPLACE, discoverGitHubPlugins, enrichEntryMetadata, fetchMarketplaceManifest, fetchRepoEntry, } from "./manifest.js";
/** Resolve one configured source into entries (repo sources probe then fall back). */
async function resolveSource(source) {
    if (source.kind === 'manifest')
        return fetchMarketplaceManifest(source.url);
    for (const url of source.probes) {
        const result = await fetchMarketplaceManifest(url);
        if (result.ok)
            return result;
    }
    return fetchRepoEntry(source.owner, source.repo);
}
/** Merge entry lists, deduping by id (first occurrence wins). */
function mergeEntries(target, extra) {
    const seen = new Set(target.map((entry) => entry.id));
    for (const entry of extra) {
        if (seen.has(entry.id))
            continue;
        seen.add(entry.id);
        target.push(entry);
    }
}
/** Bridges the catalog + inventory + clipboard onto the tab. */
export class MarketplaceController {
    listInstalled;
    getSources;
    getDiscoverGitHub;
    getSort;
    getLimit;
    store;
    /**
     * @param listInstalled - resolves installed npm package names (Host inventory).
     * @param getSources - resolves the configured sources at refresh time (read
     *   lazily so a late-resolving settings scope is picked up).
     * @param getDiscoverGitHub - whether GitHub auto-discovery is enabled.
     * @param getSort - the discovery sort ('stars' | 'date').
     * @param getLimit - how many discovered entries to show.
     */
    constructor(listInstalled, getSources, getDiscoverGitHub, getSort, getLimit) {
        this.listInstalled = listInstalled;
        this.getSources = getSources;
        this.getDiscoverGitHub = getDiscoverGitHub;
        this.getSort = getSort;
        this.getLimit = getLimit;
        this.store = createSnapshotStore({
            entries: BUNDLED_MARKETPLACE,
            source: 'bundled',
            installed: new Set(),
            copiedId: null,
            refreshing: false,
            error: null,
            discoveredTotal: null,
            sort: 'stars',
            limit: 30,
        });
        void this.refreshInstalled();
        void this.refreshRemote();
    }
    /** Fetch every source, merge the results, then merge GitHub discovery. */
    async refreshRemote() {
        const sources = this.getSources();
        const discover = this.getDiscoverGitHub();
        const sort = this.getSort();
        const limit = this.getLimit();
        this.store.update((state) => {
            state.refreshing = true;
            state.error = null;
            state.sort = sort;
            state.limit = limit;
        });
        const settled = await Promise.allSettled(sources.map((source) => resolveSource(source)));
        const merged = [];
        const attempts = [];
        for (let index = 0; index < settled.length; index += 1) {
            const source = sources[index];
            const result = settled[index];
            if (source === undefined || result === undefined)
                continue;
            if (result.status === 'fulfilled' && result.value.ok) {
                mergeEntries(merged, result.value.entries);
            }
            else if (result.status === 'fulfilled' && !result.value.ok) {
                attempts.push({ url: source.label, failure: result.value.failure });
            }
            else {
                attempts.push({ url: source.label, failure: { code: 'network' } });
            }
        }
        let discoveryFailure = null;
        let discoveredTotal = null;
        if (discover) {
            const result = await discoverGitHubPlugins(sort, limit);
            if (result.ok) {
                mergeEntries(merged, result.entries);
                discoveredTotal = result.total;
            }
            else {
                discoveryFailure = result.failure;
            }
        }
        // Enrich manifest-file entries with GitHub stars / publish date, then sort
        // the WHOLE merged list by the chosen key — so switching sort visibly
        // reorders everything, including the configured manifest entries, not just
        // the discovery slice. Entries without metadata sort to the end.
        await enrichEntryMetadata(merged);
        if (sort === 'stars') {
            merged.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name));
        }
        else {
            merged.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || a.name.localeCompare(b.name));
        }
        this.store.update((state) => {
            state.entries = merged.length > 0 ? merged : BUNDLED_MARKETPLACE;
            state.source = merged.length > 0 ? 'remote' : 'bundled';
            state.refreshing = false;
            state.discoveredTotal = discoveredTotal;
            if (merged.length === 0) {
                if (discoveryFailure !== null)
                    attempts.push({ url: 'GitHub 发现 (topic:dsh-plugin)', failure: discoveryFailure });
                state.error = attempts.length > 0 ? { attempts } : null;
            }
            else {
                state.error = null;
            }
        });
    }
    /** Re-project the Host inventory's installed package names. */
    async refreshInstalled() {
        const installed = new Set(await this.listInstalled());
        this.store.update((state) => { state.installed = installed; });
    }
    /** Refresh both the catalog and the installed projection (the tab's button + config sync). */
    refresh() {
        void this.refreshRemote();
        void this.refreshInstalled();
    }
    /** One-click install: copy the insert YAML to the clipboard (paste into the watched profile patch). */
    async install(entry) {
        try {
            await navigator.clipboard.writeText(entry.installYaml);
        }
        catch {
            // Clipboard unavailable (non-secure context): fall back to a selectable
            // textarea rendered by the tab (the YAML stays visible in the card).
        }
        this.store.update((state) => { state.copiedId = entry.id; });
        void this.refreshInstalled();
    }
    /** Wire the controller: expose the tab face. */
    mount() {
        return {
            hooks: { marketplace: this.store },
            install: (entry) => { void this.install(entry); },
            refresh: () => this.refresh(),
        };
    }
}
//# sourceMappingURL=controller.js.map