/**
 * Settings-namespace contract shared by the Host registration (node half)
 * and the browser scope (client half). Node-safe: no DOM, no React.
 */
/** Settings namespace owned by ui-custom (runtime-editable section). */
export const UI_CUSTOM_SETTINGS_NS = 'ui-custom';
/**
 * Individually selectable plugin features. The loader config's `features`
 * field is a whitelist: absent or empty = every feature mounts (backward
 * compatible); present = only the listed features register. Each feature
 * owns its settings rows / pages, so an unlisted feature is simply absent
 * from the Settings surface and the DOM.
 */
export const FEATURES = ['history', 'markdown', 'appearance', 'marketplace', 'shortcuts', 'usage', 'motion'];
/** Where the floating history strip can sit relative to the conversation. */
export const HISTORY_POSITIONS = ['left', 'right', 'off'];
/** One selectable conversation entrance-motion style. */
export const MOTION_STYLES = ['fade-up', 'fade', 'rise-scale', 'slide-in', 'blur-in', 'scale-in'];
/** Default entrance style when the user-settings document has no override. */
export const DEFAULT_MOTION_STYLE = 'fade-up';
/** Guard for a MotionStyle value (unknown ids fall back to the default). */
export const isMotionStyle = (value) => typeof value === 'string' && MOTION_STYLES.includes(value);
/**
 * Selectable sidebar entrance-motion styles. The sidebar is a horizontal
 * rail, so its motion is horizontal (slide from the screen edge) or a plain
 * cross-fade — deliberately distinct from the transcript's vertical styles.
 * The tree rows also suit a drop-in (slide-down) or a vertical unfold
 * (expand), both of which read as rows settling into the list.
 */
export const SIDEBAR_MOTION_STYLES = ['slide-left', 'fade', 'expand', 'slide-down'];
/**
 * Selectable new-conversation entrance styles. The welcome dialog is a LARGE
 * surface, so its motion is deliberately gentler than the transcript's:
 * slower (420ms), barely-there travel (4px) and no pronounced scaling or
 * sideways slides — a large block moving visibly reads as mechanical.
 * `zoom` keeps the same discipline: a whisper-quiet scale with no travel.
 */
export const NEW_CHAT_MOTION_STYLES = ['reveal', 'fade', 'bloom', 'zoom'];
/** Default new-conversation style when the user-settings document has no override. */
export const DEFAULT_NEW_CHAT_MOTION_STYLE = 'reveal';
/** Guard for a NewChatMotionStyle value (unknown ids fall back to the default). */
export const isNewChatMotionStyle = (value) => typeof value === 'string' && NEW_CHAT_MOTION_STYLES.includes(value);
/** Default sidebar style when the user-settings document has no override. */
export const DEFAULT_SIDEBAR_MOTION_STYLE = 'slide-left';
/** Guard for a SidebarMotionStyle value (unknown ids fall back to the default). */
export const isSidebarMotionStyle = (value) => typeof value === 'string' && SIDEBAR_MOTION_STYLES.includes(value);
/**
 * The three curated motion presets, in display order. Personality:
 * fluid — a lively cascade (rise-scale rows, sliding sidebar, everything on);
 * elegant — a quiet high-end feel (soft blur, plain sidebar fade, bloom);
 * minimal — barely-there fades with the selection box and settings motion off.
 */
export const MOTION_PRESETS = [
    {
        id: 'fluid',
        config: {
            motionEnabled: true,
            motionStyle: 'rise-scale',
            sidebarMotionEnabled: true,
            sidebarMotionStyle: 'slide-left',
            selectionMotionEnabled: true,
            newChatMotionEnabled: true,
            newChatMotionStyle: 'reveal',
            settingsMotionEnabled: true,
        },
    },
    {
        id: 'elegant',
        config: {
            motionEnabled: true,
            motionStyle: 'blur-in',
            sidebarMotionEnabled: true,
            sidebarMotionStyle: 'fade',
            selectionMotionEnabled: true,
            newChatMotionEnabled: true,
            newChatMotionStyle: 'bloom',
            settingsMotionEnabled: true,
        },
    },
    {
        id: 'minimal',
        config: {
            motionEnabled: true,
            motionStyle: 'fade',
            sidebarMotionEnabled: true,
            sidebarMotionStyle: 'fade',
            selectionMotionEnabled: false,
            newChatMotionEnabled: true,
            newChatMotionStyle: 'fade',
            settingsMotionEnabled: false,
        },
    },
];
/** Guard for a MotionPresetId value. */
export const isMotionPresetId = (value) => typeof value === 'string' && MOTION_PRESETS.some(preset => preset.id === value);
/** Default side when the user-settings document has no override. Off by
 * default: a fresh install shows no floating history strip until the user
 * turns it on in General settings. */
export const DEFAULT_HISTORY_POSITION = 'off';
/** How many recent turns the strip shows when the user has no override (0 = all). */
export const DEFAULT_HISTORY_LIMIT = 10;
//# sourceMappingURL=shared.js.map