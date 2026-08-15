/** The 插件市场 tab: catalog cards with GitHub links and one-click install. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { MarketplaceInjected } from './controller.ts';
/** Props the renderer binds for the tab. */
export type MarketplaceTabProps = PropsRuntime<'settings.plugins.tab'> & PropsLocale<'marketplace'> & InjectFace<MarketplaceInjected>;
/**
 * Render the marketplace tab content.
 * @param props - composed slot props + injected controller face.
 * @returns the tab element tree.
 */
export declare function MarketplaceTab({ t, useMarketplace, install, refresh, setDiscoverSort, setDiscoverLimit }: MarketplaceTabProps): import("react").JSX.Element;
//# sourceMappingURL=MarketplaceTab.d.ts.map