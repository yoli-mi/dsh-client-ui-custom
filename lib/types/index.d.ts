/**
 * Web-surface theme plugin, node half: registers the runtime-editable
 * settings section (theme "外观" + shortcuts "快捷键" pages) so the browser
 * scope can read/write it. The theme itself is pure browser work.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ShortcutConfig } from './client/config.ts';
import type { HistoryPosition, ThemeSection } from './shared.ts';
/** Plugin config shape accepted at the loader layer (flat theme + nested shortcuts). */
interface UiCustomConfig extends Partial<ThemeSection> {
    shortcuts?: Partial<ShortcutConfig>;
    /** History strip recent-turns limit (0 = show all). */
    historyLimit?: number;
    /** History strip side ('left' / 'right') or hidden ('off'). */
    historyPosition?: HistoryPosition;
    /** Pinned turn numbers per session (ignore the strip's count limit). */
    pinnedTurns?: Record<string, number[]>;
    /**
     * Marketplace catalog source(s): raw manifest JSON URL(s) and/or GitHub
     * repo URL(s), comma/newline separated. Seeded into the settings namespace
     * so the browser scope can read it.
     */
    marketplaceUrl?: string;
    /** Auto-discover `dsh-plugin` topic repos from GitHub (default true). */
    discoverGitHub?: boolean;
    /** Discovery sort: 'stars' (default) or 'date' (publish date, recent first). */
    discoverSort?: 'stars' | 'date';
    /** How many discovered entries to show (default 30). */
    discoverLimit?: number;
}
/**
 * Host plugin body: expose the ui-custom settings namespace to the web
 * client when the settings service is composed. The namespace's composition
 * base carries the loader config (flat theme fields + nested shortcuts), so a
 * cleared field reverts to the loader default and the settings pages layer on
 * top of it.
 * @param ctx - Host context that may acquire the settings service.
 * @param config - the plugin's loader-layer config.
 */
export declare function apply(ctx: Context, config?: UiCustomConfig): void;
export {};
//# sourceMappingURL=index.d.ts.map