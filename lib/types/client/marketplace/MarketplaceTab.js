import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** The 插件市场 tab: catalog cards with GitHub links and one-click install. */
import { useEffect, useState } from 'react';
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './MarketplaceTab.module.css';
/** Selectable discovery counts. */
const DISCOVER_LIMITS = [10, 20, 30, 50];
/**
 * Render the marketplace tab content.
 * @param props - composed slot props + injected controller face.
 * @returns the tab element tree.
 */
export function MarketplaceTab({ t, useMarketplace, install, refresh, setDiscoverSort, setDiscoverLimit }) {
    const state = useMarketplace((value) => value);
    const translator = t;
    const [flash, setFlash] = useState(null);
    const [sortOpen, setSortOpen] = useState(false);
    const [limitOpen, setLimitOpen] = useState(false);
    // Flash the "copied" badge for a couple of seconds.
    useEffect(() => {
        if (state.copiedId === null)
            return;
        setFlash(state.copiedId);
        const timer = setTimeout(() => setFlash(null), 2500);
        return () => clearTimeout(timer);
    }, [state.copiedId]);
    return (_jsxs("div", { className: css.section, children: [_jsx("h2", { className: css.heading, children: translator('title') }), _jsx("p", { className: css.intro, children: translator('intro') }), _jsxs("div", { className: css.toolbar, children: [_jsxs("span", { className: css.source, children: [translator('source'), "\uFF1A", translator(state.source === 'remote' ? 'source.remote' : 'source.bundled'), state.discoveredTotal !== null && ` · ${translator('total')}：${state.discoveredTotal}`] }), _jsxs("div", { className: css.toolbarRight, children: [_jsx(Menu, { open: sortOpen, onClose: () => { setSortOpen(false); }, items: [
                                    { id: 'stars', label: translator('sort.stars') },
                                    { id: 'date', label: translator('sort.date') },
                                ], selectedId: state.sort, onSelect: (id) => {
                                    setSortOpen(false);
                                    if (id === 'stars' || id === 'date')
                                        setDiscoverSort(id);
                                }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, "aria-haspopup": "menu", "aria-expanded": sortOpen, onClick: () => { setSortOpen((value) => !value); }, children: [translator(state.sort === 'date' ? 'sort.date' : 'sort.stars'), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) }), _jsx(Menu, { open: limitOpen, onClose: () => { setLimitOpen(false); }, items: DISCOVER_LIMITS.map((count) => ({ id: String(count), label: String(count) })), selectedId: String(state.limit), onSelect: (id) => {
                                    setLimitOpen(false);
                                    const count = Number(id);
                                    if (Number.isFinite(count))
                                        setDiscoverLimit(count);
                                }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, "aria-haspopup": "menu", "aria-expanded": limitOpen, onClick: () => { setLimitOpen((value) => !value); }, children: [String(state.limit), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) }), _jsx("button", { type: "button", className: css.refresh, onClick: refresh, disabled: state.refreshing, children: state.refreshing ? translator('refreshing') : translator('refresh') })] })] }), state.error !== null && (_jsxs("div", { className: css.error, role: "alert", children: [_jsx("p", { className: css.errorTitle, children: translator('error') }), _jsx("p", { className: css.errorHint, children: translator('errorHint') }), state.error.attempts.length > 0 && (_jsx("ul", { className: css.errorList, children: state.error.attempts.map((attempt) => (_jsxs("li", { className: css.errorItem, children: [_jsx("span", { className: css.errorUrl, children: attempt.url }), _jsxs("span", { className: css.errorCode, children: [translator(attempt.failure.code === 'network'
                                            ? 'errorNetwork'
                                            : attempt.failure.code === 'http'
                                                ? 'errorHttp'
                                                : 'errorInvalid'), attempt.failure.code === 'http' && 'status' in attempt.failure
                                            ? ` (${attempt.failure.status})`
                                            : ''] })] }, attempt.url))) }))] })), _jsx("div", { className: css.list, children: state.entries.length === 0 ? (_jsx("p", { className: css.intro, children: translator('empty') })) : state.entries.map((entry) => (_jsx(MarketplaceCard, { entry: entry, installed: state.installed.has(entry.package), copied: flash === entry.id, t: translator, onInstall: install }, entry.id))) })] }));
}
/** One marketplace card. */
function MarketplaceCard({ entry, installed, copied, t, onInstall, }) {
    return (_jsxs("div", { className: css.card, children: [_jsxs("div", { className: css.body, children: [_jsxs("div", { className: css.nameRow, children: [_jsx("span", { className: css.name, children: entry.name }), installed && _jsx("span", { className: css.badge, children: t('installed') })] }), _jsx("span", { className: css.pkg, children: entry.package }), _jsx("p", { className: css.description, children: entry.description }), copied && _jsx("p", { className: `${css.hint} ${css.copied}`, children: t('copied') }), !installed && _jsx("p", { className: css.hint, children: t('installHint') })] }), _jsxs("div", { className: css.actions, children: [entry.repoUrl !== '' && (_jsx("a", { className: css.github, href: entry.repoUrl, target: "_blank", rel: "noreferrer", children: t('openOnGitHub') })), _jsx("button", { type: "button", className: installed ? `${css.install} ${css.installInstalled}` : css.install, disabled: installed, onClick: () => onInstall(entry), children: copied ? t('copied') : installed ? t('installed') : t('install') })] })] }));
}
//# sourceMappingURL=MarketplaceTab.js.map