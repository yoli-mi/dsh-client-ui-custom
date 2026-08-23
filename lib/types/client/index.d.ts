/**
 * Web-surface theme plugin, browser half: theme customization + user
 * keyboard shortcuts, plus the "快捷键" settings section.
 *
 * Theme pipeline (config.ts / presets.ts / apply.ts):
 *   DEFAULTS ← preset (preset: '<id>') ← profile config, then
 *   normalizeConfig() clamps every field and applyConfig() writes the
 *   `--dsu-*` variables the stylesheet consumes. The whole override set is
 *   gated behind `html[data-dsu-active]`; with no wallpaper configured the
 *   theme side is a no-op and the profile stays stock.
 *
 * Shortcuts (shortcuts.ts / actions.ts): user-configured keybindings for
 * new-conversation, next-model, and thinking-effort cycling, dispatched over
 * the same services the built-in UI uses. Bindings merge the loader-config
 * defaults with the runtime settings section (`ui-custom` namespace, editable
 * from the "快捷键" settings page), so a change there applies immediately.
 *
 * Feature selection (config.ts resolveFeatures / shared.ts FEATURES): each
 * independently selectable feature (history / markdown / appearance /
 * marketplace / shortcuts / usage / motion) mounts its own settings rows,
 * pages and DOM effects. The loader config's `features` whitelist decides
 * which mount; absent or empty = everything (backward compatible).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type CustomThemeConfig } from './config.ts';
import './custom.module.css';
export type { CustomThemeConfig } from './config.ts';
export type { ThemePreset } from './presets.ts';
export { DEFAULTS, CONFIG_KEYS, SHORTCUT_DEFAULTS, SHORTCUT_ACTIONS, normalizeConfig, resolveFeatures, clampNumber, cleanString } from './config.ts';
export { PRESETS, PRESET_MAP, resolvePreset } from './presets.ts';
export { parseKeyCombo, matchesKeyCombo, buildShortcutMap, keyToToken, specFromEvent } from './shortcuts.ts';
export { switchModel, cycleThinking, newConversation, selectModelDirect, modelCatalogOptions } from './actions.ts';
export { FEATURES, type PluginFeature } from '../shared.ts';
/** Required services: theme (none extra), shortcuts (connection/sessions/workspaces), settings UI (slots/locale/settingsScope), marketplace (remote inventory), history (layout). */
export declare const inject: string[];
/**
 * Client plugin body: mount each enabled feature (appearance / shortcuts /
 * usage / marketplace / history / markdown). The loader config's `features`
 * whitelist decides which features register; absent = everything.
 * @param ctx - client root context.
 * @param config - profile-level plugin config (partial over the preset).
 */
export declare function apply(ctx: ClientContext, config?: Partial<CustomThemeConfig>): void;
//# sourceMappingURL=index.d.ts.map