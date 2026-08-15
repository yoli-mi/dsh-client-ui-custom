/**
 * Settings-namespace contract shared by the Host registration (node half)
 * and the browser scope (client half). Node-safe: no DOM, no React.
 */
/** Settings namespace owned by ui-custom (runtime-editable section). */
export const UI_CUSTOM_SETTINGS_NS = 'ui-custom';
/** Where the floating history strip can sit relative to the conversation. */
export const HISTORY_POSITIONS = ['left', 'right', 'off'];
/** Default side when the user-settings document has no override. Off by
 * default: a fresh install shows no floating history strip until the user
 * turns it on in General settings. */
export const DEFAULT_HISTORY_POSITION = 'off';
/** How many recent turns the strip shows when the user has no override (0 = all). */
export const DEFAULT_HISTORY_LIMIT = 10;
//# sourceMappingURL=shared.js.map