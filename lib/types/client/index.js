import { SHORTCUT_HANDLERS, modelCatalogOptions, selectModelDirect } from "./actions.js";
import { applyConfig } from "./apply.js";
import { installComposerInput } from "./composer.js";
import { normalizeConfig, resolveFeatures } from "./config.js";
import { resolvePreset } from "./presets.js";
import { buildShortcutMap, comboEnabled, isEditableTarget, matchesKeyCombo, parseKeyCombo, } from "./shortcuts.js";
import { UI_CUSTOM_SETTINGS_NS } from "../shared.js";
import { usageOverlay } from "./usage-overlay.js";
import { NS, en, zh } from "./locales.js";
import { USAGE_NS, en as usageEn, zh as usageZh } from "./usage/usage-locales.js";
import { APPEARANCE_NS, en as appearanceEn, zh as appearanceZh } from "./appearance/appearance-locales.js";
import { ShortcutsSettingsController } from "./settings/contract.js";
import { ShortcutsSection } from "./settings/ShortcutsSection.js";
import { AppearanceSettingsController } from "./appearance/controller.js";
import { AppearanceSection } from "./appearance/AppearanceSection.js";
import { PreviewBar } from "./appearance/PreviewBar.js";
import { previewBar } from "./preview-bar.js";
import { UsageSection } from "./usage/UsageSection.js";
import { UsageOverlay } from "./usage/UsageOverlay.js";
import { MARKETPLACE_NS, en as marketEn, zh as marketZh } from "./marketplace/marketplace-locales.js";
import { DEFAULT_MARKETPLACE_URL, deriveMarketplaceSources } from "./marketplace/manifest.js";
import { MarketplaceController } from "./marketplace/controller.js";
import { MarketplaceTab } from "./marketplace/MarketplaceTab.js";
import { configFromThemeSection } from "./theme-section.js";
import { HISTORY_NS, zh as historyZh, en as historyEn } from "./history/history-locales.js";
import { HistoryStrip } from "./history/HistoryStrip.js";
import { HistoryPositionRow } from "./history/HistoryPositionRow.js";
import { HistoryLimitRow } from "./history/HistoryLimitRow.js";
import { PIN_NS, zh as pinZh, en as pinEn } from "./pin/pin-locales.js";
import { PinTurnAction } from "./pin/PinTurnAction.js";
import { MARKDOWN_NS, zh as markdownZh, en as markdownEn } from "./markdown/markdown-locales.js";
import { MarkdownRenderRow } from "./markdown/MarkdownRenderRow.js";
import { UserMarkdownNodeView } from "./markdown/UserMarkdownNodeView.js";
import './custom.module.css';
export { DEFAULTS, CONFIG_KEYS, SHORTCUT_DEFAULTS, SHORTCUT_ACTIONS, normalizeConfig, resolveFeatures, clampNumber, cleanString } from "./config.js";
export { PRESETS, PRESET_MAP, resolvePreset } from "./presets.js";
export { parseKeyCombo, matchesKeyCombo, buildShortcutMap, keyToToken, specFromEvent } from "./shortcuts.js";
export { switchModel, cycleThinking, newConversation, selectModelDirect, modelCatalogOptions } from "./actions.js";
export { FEATURES } from "../shared.js";
/** Required services: theme (none extra), shortcuts (connection/sessions/workspaces), settings UI (slots/locale/settingsScope), marketplace (remote inventory), history (layout). */
export const inject = ['slots', 'locale', 'connection', 'sessions', 'workspaces', 'settingsScope', 'remote', 'remote.pluginInventory', 'layout'];
/**
 * Install the keydown listener for the dispatcher actions. All bindings share
 * one capture-phase listener; the first action whose combo matches wins and
 * the event is consumed. Standard actions dispatch first, then the one-to-one
 * model shortcuts (each combo jumps to its specific model). Re-installable:
 * returns the disposer.
 * @param ctx - client root context (for action dispatch).
 * @param shortcuts - normalized shortcut config.
 * @param disabledActions - actions to skip entirely (cross-feature gating: an
 * action whose target feature is not mounted is never dispatched).
 * @returns the disposer removing the listener.
 */
function installShortcuts(ctx, shortcuts, disabledActions = new Set()) {
    const combos = buildShortcutMap(shortcuts);
    // Only dispatcher actions dispatch; sendMessage/newline are composer remaps.
    const actions = Object.keys(SHORTCUT_HANDLERS)
        .filter((action) => !disabledActions.has(action));
    const modelShortcuts = shortcuts.modelShortcuts
        .map(entry => ({ entry, combo: parseKeyCombo(entry.combo) }))
        .filter((item) => item.combo !== null);
    const enabled = actions.some((action) => comboEnabled(combos[action])) || modelShortcuts.length > 0;
    if (!enabled)
        return () => { };
    const handler = (event) => {
        // Don't hijack plain typing: combos without Mod are suppressed while an
        // editable field has focus; Mod combos still fire.
        if (isEditableTarget(event.target) && !(event.ctrlKey || event.metaKey))
            return;
        for (const action of actions) {
            const combo = combos[action];
            if (combo === null || !matchesKeyCombo(combo, event))
                continue;
            event.preventDefault();
            event.stopPropagation();
            const handler = SHORTCUT_HANDLERS[action];
            if (handler === undefined)
                continue;
            void Promise.resolve(handler(ctx, shortcuts)).catch(() => { });
            return;
        }
        for (const { entry, combo } of modelShortcuts) {
            if (!matchesKeyCombo(combo, event))
                continue;
            event.preventDefault();
            event.stopPropagation();
            void Promise.resolve(selectModelDirect(ctx, entry.provider, entry.model)).catch(() => { });
            return;
        }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
}
/**
 * Client plugin body: mount each enabled feature (appearance / shortcuts /
 * usage / marketplace / history / markdown). The loader config's `features`
 * whitelist decides which features register; absent = everything.
 * @param ctx - client root context.
 * @param config - profile-level plugin config (partial over the preset).
 */
export function apply(ctx, config) {
    const presetId = typeof config?.preset === 'string' ? config.preset : '';
    const normalized = normalizeConfig(config, resolvePreset(presetId));
    const features = resolveFeatures(config);
    const enabled = (feature) => features.has(feature);
    // Theme application belongs to the 外观 feature: without it the plugin never
    // touches the document theme and the config stays inert.
    if (enabled('appearance'))
        applyConfig(normalized);
    // Native widgets (range tracks, select dropdown panels, color pickers) are
    // drawn from the root color-scheme. The shell sets it once at boot from the
    // OS preference and never re-syncs it to the app theme, so keep it pinned to
    // the ACTIVE theme (body[data-ds-dark-theme]) here — otherwise a light theme
    // on a dark OS leaves black slider tracks, and a dark theme on a light OS
    // leaves white dropdown panels.
    ctx.effect(() => {
        const syncColorScheme = () => {
            const dark = document.body.hasAttribute('data-ds-dark-theme');
            document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
        };
        syncColorScheme();
        const observer = new MutationObserver(syncColorScheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
        return () => { observer.disconnect(); };
    }, 'ui-custom: color-scheme follows the active theme');
    // ── Locales: register only the mounted features' dictionaries ────────────
    if (enabled('shortcuts'))
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-custom: section dictionaries');
    if (enabled('usage'))
        ctx.effect(() => ctx.locale.register(USAGE_NS, { zh: usageZh, en: usageEn }), 'ui-custom: usage dictionaries');
    if (enabled('appearance')) {
        ctx.effect(() => ctx.locale.register(APPEARANCE_NS, { zh: appearanceZh, en: appearanceEn }), 'ui-custom: appearance dictionaries');
    }
    if (enabled('marketplace')) {
        ctx.effect(() => ctx.locale.register(MARKETPLACE_NS, { zh: marketZh, en: marketEn }), 'ui-custom: marketplace dictionaries');
    }
    if (enabled('history')) {
        ctx.effect(() => ctx.locale.register(HISTORY_NS, { zh: historyZh, en: historyEn }), 'ui-custom: history dictionaries');
        ctx.effect(() => ctx.locale.register(PIN_NS, { zh: pinZh, en: pinEn }), 'ui-custom: pin dictionaries');
    }
    if (enabled('markdown')) {
        ctx.effect(() => ctx.locale.register(MARKDOWN_NS, { zh: markdownZh, en: markdownEn }), 'ui-custom: markdown dictionaries');
    }
    // The runtime settings scope is shared by every feature that reads or
    // writes the ui-custom namespace (theme, shortcuts, history, marketplace…).
    const scope = ctx.settingsScope.bind({ namespace: UI_CUSTOM_SETTINGS_NS });
    // ── 外观：theme pipeline + appearance section + preview hint ─────────────
    if (enabled('appearance')) {
        const appearanceT = ctx.locale.bind(APPEARANCE_NS);
        const applyTheme = () => {
            const snapshot = scope.getSnapshot();
            // darkSurfaceOpacity is an explicit override only when the RAW user layer
            // carries it; otherwise the dark main surface follows the live
            // surfaceOpacity (theme-section.ts falls back to section.surfaceOpacity).
            const user = snapshot.user;
            const explicitDark = typeof user === 'object' && user !== null && 'darkSurfaceOpacity' in user;
            let effective;
            if (snapshot.value === undefined) {
                effective = undefined;
            }
            else if (explicitDark) {
                effective = snapshot.value;
            }
            else {
                const { darkSurfaceOpacity: _inherited, ...rest } = snapshot.value;
                effective = { ...rest, darkSurfaceOpacity: undefined };
            }
            applyConfig(configFromThemeSection(normalized, effective));
        };
        applyTheme();
        ctx.effect(() => scope.subscribe(applyTheme), 'ui-custom: theme settings sync');
        // The 外观 section hosts the theme-preference row (ui-theme, merged via
        // the settings.appearance.item child slot) plus the art-customization
        // form. Preview renders the staged draft to the document WITHOUT touching
        // the scope, so the user decides (save / cancel) after seeing the effect.
        const appearance = new AppearanceSettingsController(scope, normalized, (config) => applyConfig(config));
        const { dispose: disposeAppearance, actions: appearanceActions } = appearance.mount();
        ctx.effect(() => () => disposeAppearance(), 'ui-custom: appearance settings scope');
        ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'appearance',
            order: 10,
            label: () => appearanceT('nav'),
            locale: APPEARANCE_NS,
            children: { 'settings.appearance.item': { kind: 'list', scope: 'root' } },
            inject: () => ({
                hooks: { appearance: appearance.store },
                ...appearanceActions,
            }),
        }, AppearanceSection));
        // Preview hint: clean "F2 to exit" pill while the draft is previewed.
        // F2 exits preview mode and reopens the settings page (the settings shell
        // keeps its open state component-local, so the only programmatic opener
        // is the sidebar trigger — located by its dialog aria + localized label —
        // then the appearance nav row, so the user lands back on the tweaks).
        const reopenSettings = () => {
            const triggers = document.querySelectorAll('[aria-haspopup="dialog"]');
            for (const trigger of triggers) {
                const label = trigger.textContent ?? '';
                if (label.includes('设置') || label.includes('Settings') || label.includes('設定')) {
                    trigger.click();
                    break;
                }
            }
            window.setTimeout(() => {
                const rows = document.querySelectorAll('button');
                for (const row of rows) {
                    const text = (row.textContent ?? '').trim();
                    if (text === '外观' || text === 'Appearance' || text === '外觀') {
                        row.click();
                        return;
                    }
                }
            }, 60);
        };
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'ui-custom-preview',
            order: 90,
            locale: APPEARANCE_NS,
            inject: () => ({
                hooks: { previewVisible: previewBar },
                onExit: () => { previewBar.hide(); reopenSettings(); },
            }),
        }, PreviewBar));
    }
    // ── 快捷键：loader defaults + runtime settings section ───────────────────
    if (enabled('shortcuts')) {
        const t = ctx.locale.bind(NS);
        let disposeShortcuts;
        const applyShortcuts = () => {
            disposeShortcuts?.();
            const section = scope.getSnapshot().value;
            const shortcuts = {
                newConversation: section?.newConversation ?? normalized.shortcuts.newConversation,
                switchModel: section?.switchModel ?? normalized.shortcuts.switchModel,
                cycleThinking: section?.cycleThinking ?? normalized.shortcuts.cycleThinking,
                sendMessage: section?.sendMessage ?? normalized.shortcuts.sendMessage,
                newline: section?.newline ?? normalized.shortcuts.newline,
                usagePanel: section?.usagePanel ?? normalized.shortcuts.usagePanel,
                defaultWorkspace: section?.defaultWorkspace ?? normalized.shortcuts.defaultWorkspace,
                modelShortcuts: section?.modelShortcuts ?? normalized.shortcuts.modelShortcuts,
            };
            const disposeActions = installShortcuts(ctx, shortcuts, 
            // Cross-feature gate: the usage-panel binding only dispatches when the
            // usage feature is mounted too.
            enabled('usage') ? undefined : new Set(['usagePanel']));
            const disposeComposer = installComposerInput(shortcuts);
            disposeShortcuts = () => {
                disposeActions();
                disposeComposer();
            };
        };
        applyShortcuts();
        ctx.effect(() => scope.subscribe(applyShortcuts), 'ui-custom: shortcut settings sync');
        ctx.effect(() => () => disposeShortcuts?.(), 'ui-custom: shortcut listener teardown');
        const controller = new ShortcutsSettingsController(scope, normalized.shortcuts, () => modelCatalogOptions(ctx));
        const { dispose: disposeScope, actions } = controller.mount();
        ctx.effect(() => () => disposeScope(), 'ui-custom: shortcut settings scope');
        // Refresh the model catalog when the current session changes (the shortcut
        // targets address the current session's catalog).
        void controller.refreshModels();
        const unsubscribeModels = ctx.sessions.list.subscribe(() => { void controller.refreshModels(); });
        ctx.effect(() => () => unsubscribeModels(), 'ui-custom: model catalog sync');
        ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'shortcuts',
            order: 20,
            label: () => t('nav'),
            locale: NS,
            inject: () => ({
                hooks: {
                    shortcuts: controller.store,
                    workspaces: ctx.workspaces.list,
                    models: controller.models,
                },
                usageAvailable: enabled('usage'),
                ...actions,
            }),
        }, ShortcutsSection));
    }
    // ── 用量统计：settings section + anywhere overlay ────────────────────────
    if (enabled('usage')) {
        const usageT = ctx.locale.bind(USAGE_NS);
        ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'usage',
            order: 25,
            label: () => usageT('nav'),
            locale: USAGE_NS,
            inject: () => ({ hooks: { sessions: ctx.sessions.list } }),
        }, UsageSection));
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'ui-custom-usage',
            order: 100,
            locale: USAGE_NS,
            inject: () => ({
                hooks: { sessions: ctx.sessions.list, usageVisible: usageOverlay },
            }),
        }, UsageOverlay));
    }
    // ── 插件市场 tab（设置 → 插件 → 插件市场）────────────────────────────────
    // Manifest sources + the discovery switch come from the ui-custom settings
    // namespace: the host seeds the loader config's marketplaceUrl /
    // discoverGitHub into the scope base, and the client reads them here (the
    // client apply() never receives the loader config — client graph rows carry
    // no config). Unset falls back to the shipped default URL;
    // deriveMarketplaceSources expands repo URLs and multi-source lists.
    if (enabled('marketplace')) {
        const marketplaceT = ctx.locale.bind(MARKETPLACE_NS);
        const marketplace = new MarketplaceController(async () => {
            const result = await ctx.remote.pluginInventory.list();
            if (!result.ok)
                return [];
            return result.value.entries.map((entry) => entry.moduleName);
        }, () => {
            const setting = scope.getSnapshot().value?.marketplaceUrl;
            return deriveMarketplaceSources(setting !== undefined && setting.trim() !== '' ? setting : DEFAULT_MARKETPLACE_URL);
        }, () => scope.getSnapshot().value?.discoverGitHub ?? false, () => scope.getSnapshot().value?.discoverSort === 'date' ? 'date' : 'stars', () => {
            const raw = scope.getSnapshot().value?.discoverLimit;
            return typeof raw === 'number' && Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.round(raw))) : 30;
        });
        // Re-fetch only when the marketplace settings resolve or change (a late
        // scope resolution, or a config edit) — not on unrelated settings changes.
        let lastMarketplaceKey;
        const applyMarketplace = () => {
            const section = scope.getSnapshot().value;
            const key = `${section?.marketplaceUrl ?? ''}|${section?.discoverGitHub ?? false}|${section?.discoverSort ?? 'stars'}|${section?.discoverLimit ?? 30}`;
            if (key === lastMarketplaceKey)
                return;
            lastMarketplaceKey = key;
            void marketplace.refresh();
        };
        ctx.effect(() => scope.subscribe(applyMarketplace), 'ui-custom: marketplace source sync');
        ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
            name: 'settings.plugins.tab',
            id: 'marketplace',
            order: 30,
            label: () => marketplaceT('tab'),
            locale: MARKETPLACE_NS,
            inject: () => ({
                ...marketplace.mount(),
                setDiscoverSort: (sort) => { void scope.set('discoverSort', sort); },
                setDiscoverLimit: (limit) => { void scope.set('discoverLimit', limit); },
            }),
        }, MarketplaceTab));
    }
    // ── 历史记录条：strip + pin + General rows ───────────────────────────────
    // Registered in the details slot, which stays mounted even at zero width
    // (the frame never unmounts it). The panel renders `position: fixed`
    // content floating over the conversation's right edge — so the history is
    // part of the body (ZCode-style), with no separate column and no toggle.
    if (enabled('history')) {
        ctx.slots.inject('details', () => ctx.slots.register({
            name: 'details',
            priority: -1,
            locale: HISTORY_NS,
            inject: (sessionId) => ({
                // The history pages the mounted window backwards until the full
                // conversation is loaded, so old sessions show a complete strip.
                loadOlder: () => {
                    void ctx.sessions.binding(sessionId)?.session.loadOlder();
                },
                sessionId,
                hooks: { historyLimit: scope, historyPosition: scope, pinnedTurns: scope },
            }),
        }, HistoryStrip));
        // Pin ("悬挂"): pin a turn to the history strip. The assistant-actions
        // row (between copy and branch) carries the toggle; pinned turns ignore
        // the strip's count limit and show with the accent frame. The button
        // hides itself while the strip is disabled ('off').
        ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
            name: 'conversation.chat.assistant-actions',
            id: 'ui-custom-pin',
            order: 5,
            locale: PIN_NS,
            inject: (sessionId) => {
                const togglePin = (turn) => {
                    const record = scope.getSnapshot().value?.pinnedTurns ?? {};
                    const current = record[sessionId] ?? [];
                    const next = current.includes(turn)
                        ? current.filter(n => n !== turn)
                        : [...current, turn].sort((a, b) => a - b);
                    const updated = { ...record };
                    if (next.length === 0)
                        delete updated[sessionId];
                    else
                        updated[sessionId] = next;
                    // Keep the settings document tidy: no pins at all → drop the field.
                    if (Object.keys(updated).length === 0)
                        void scope.unset('pinnedTurns');
                    else
                        void scope.set('pinnedTurns', updated);
                };
                return {
                    sessionId,
                    hooks: { position: scope, pinnedTurns: scope },
                    togglePin,
                };
            },
        }, PinTurnAction));
        // General-settings rows: where the strip sits (or hidden), then how many
        // recent turns it shows — the count row only renders while not 'off'.
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
            name: 'settings.general.item',
            id: 'ui-custom-history-position',
            order: 40,
            locale: HISTORY_NS,
            inject: () => ({
                hooks: { historyPosition: scope },
                setHistoryPosition: (position) => { void scope.set('historyPosition', position); },
            }),
        }, HistoryPositionRow));
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
            name: 'settings.general.item',
            id: 'ui-custom-history-limit',
            order: 50,
            locale: HISTORY_NS,
            inject: () => ({
                hooks: { historyLimit: scope },
                setHistoryLimit: (limit) => { void scope.set('historyLimit', limit); },
            }),
        }, HistoryLimitRow));
    }
    // ── 用户消息 Markdown 渲染：General row + user/steering node shadowing ────
    if (enabled('markdown')) {
        // General-settings row: whether the user's own messages render as Markdown.
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
            name: 'settings.general.item',
            id: 'ui-custom-md-render',
            order: 55,
            locale: MARKDOWN_NS,
            inject: () => ({
                hooks: { mdRender: scope },
                setRenderUserMarkdown: (enabled) => { void scope.set('renderUserMarkdown', enabled); },
            }),
        }, MarkdownRenderRow));
        // Shadow the user/steering chat cells (priority -1 wins over the stock
        // renderer): the bubble renders the text as Markdown while the toggle is
        // on, and falls back to the stock plain-text look when off.
        ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
            name: 'conversation.chat.node',
            key: 'user',
            priority: -1,
            locale: 'conversation',
            inject: () => ({ hooks: { mdRender: scope } }),
        }, UserMarkdownNodeView));
        ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
            name: 'conversation.chat.node',
            key: 'steering',
            priority: -1,
            locale: 'conversation',
            inject: () => ({ hooks: { mdRender: scope } }),
        }, UserMarkdownNodeView));
    }
    // Type-reference the connection face so its injection is tracked (used by actions).
    void ctx.get('connection');
}
//# sourceMappingURL=index.js.map