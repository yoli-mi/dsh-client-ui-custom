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
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import { type MarketplaceEntry, type MarketplaceFetchFailure, type MarketplaceSource } from './manifest.ts';
/** One failed source (kept for the tab's error panel). */
export interface MarketplaceSourceFailure {
    /** The source label (URL or repo path) that failed. */
    url: string;
    /** Categorized reason. */
    failure: MarketplaceFetchFailure;
}
/** What the tab renders. */
export interface MarketplaceState {
    entries: readonly MarketplaceEntry[];
    /** Whether the shown catalog came from the remote manifests / discovery. */
    source: 'bundled' | 'remote';
    /** npm package names present in the Host plugin inventory (already loaded). */
    installed: ReadonlySet<string>;
    /** Id of the entry whose install snippet was last copied (transient badge). */
    copiedId: string | null;
    /** Whether a refresh is in flight (drives the button state). */
    refreshing: boolean;
    /** Non-null when every source failed; the tab renders the reasons. */
    error: {
        attempts: readonly MarketplaceSourceFailure[];
    } | null;
    /** Total dsh-plugin repos on GitHub (from the discovery search); null when discovery is off or failed. */
    discoveredTotal: number | null;
    /** The active discovery sort (drives the tab's sort selector). */
    sort: 'stars' | 'date';
    /** The active discovery limit (drives the tab's count selector). */
    limit: number;
}
/** The tab's registration face. */
export interface MarketplaceInjected {
    hooks: {
        marketplace: HostObservable<MarketplaceState>;
    };
    install(entry: MarketplaceEntry): void;
    refresh(): void;
    /** Persist the discovery sort ('stars' | 'date'); the scope change re-refreshes. */
    setDiscoverSort(sort: 'stars' | 'date'): void;
    /** Persist the discovery limit; the scope change re-refreshes. */
    setDiscoverLimit(limit: number): void;
}
/** Bridges the catalog + inventory + clipboard onto the tab. */
export declare class MarketplaceController {
    private readonly listInstalled;
    private readonly getSources;
    private readonly getDiscoverGitHub;
    private readonly getSort;
    private readonly getLimit;
    readonly store: SnapshotStore<MarketplaceState>;
    /**
     * @param listInstalled - resolves installed npm package names (Host inventory).
     * @param getSources - resolves the configured sources at refresh time (read
     *   lazily so a late-resolving settings scope is picked up).
     * @param getDiscoverGitHub - whether GitHub auto-discovery is enabled.
     * @param getSort - the discovery sort ('stars' | 'date').
     * @param getLimit - how many discovered entries to show.
     */
    constructor(listInstalled: () => Promise<readonly string[]>, getSources: () => MarketplaceSource[], getDiscoverGitHub: () => boolean, getSort: () => 'stars' | 'date', getLimit: () => number);
    /** Fetch every source, merge the results, then merge GitHub discovery. */
    refreshRemote(): Promise<void>;
    /** Re-project the Host inventory's installed package names. */
    refreshInstalled(): Promise<void>;
    /** Refresh both the catalog and the installed projection (the tab's button + config sync). */
    refresh(): void;
    /** One-click install: copy the insert YAML to the clipboard (paste into the watched profile patch). */
    install(entry: MarketplaceEntry): Promise<void>;
    /** Wire the controller: expose the tab face. */
    mount(): Omit<MarketplaceInjected, 'setDiscoverSort' | 'setDiscoverLimit'>;
}
//# sourceMappingURL=controller.d.ts.map