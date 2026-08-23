import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The "动效" settings section: the conversation entrance-motion toggle plus
 * the entrance-style selector. Reads/writes the ui-custom settings scope's
 * `motionEnabled` / `motionStyle`; the motion engine (motion.ts) gates on
 * these.
 */
import { useState } from 'react';
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { DEFAULT_MOTION_STYLE, DEFAULT_NEW_CHAT_MOTION_STYLE, DEFAULT_SIDEBAR_MOTION_STYLE, MOTION_PRESETS, isMotionStyle, isNewChatMotionStyle, isSidebarMotionStyle, } from "../../shared.js";
import css from './MotionSection.module.css';
/** The selectable transcript styles, in display order (the default is the first). */
const STYLE_OPTIONS = [
    { id: 'fade-up', label: 'styleFadeUp' },
    { id: 'fade', label: 'styleFade' },
    { id: 'rise-scale', label: 'styleRiseScale' },
    { id: 'slide-in', label: 'styleSlideIn' },
    { id: 'blur-in', label: 'styleBlurIn' },
    { id: 'scale-in', label: 'styleScaleIn' },
];
/** The selectable sidebar styles, in display order (the default is the first). */
const SIDEBAR_OPTIONS = [
    { id: 'slide-left', label: 'styleSlideLeft' },
    { id: 'fade', label: 'styleFade' },
    { id: 'expand', label: 'styleExpand' },
    { id: 'slide-down', label: 'styleSlideDown' },
];
/** The selectable new-conversation styles (large-surface, gentle set). */
const NEW_CHAT_OPTIONS = [
    { id: 'reveal', label: 'styleReveal' },
    { id: 'fade', label: 'styleFade' },
    { id: 'bloom', label: 'styleBloom' },
    { id: 'zoom', label: 'styleZoom' },
];
/** Preset label + description locale keys, keyed by preset id (see MOTION_PRESETS). */
const PRESET_META = {
    fluid: { label: 'presetFluid', desc: 'presetFluidDesc' },
    elegant: { label: 'presetElegant', desc: 'presetElegantDesc' },
    minimal: { label: 'presetMinimal', desc: 'presetMinimalDesc' },
};
/** Whether a config bundle matches the section's current motion values. */
function matchesPreset(section, config) {
    return (section?.motionEnabled ?? true) === config.motionEnabled
        && (section?.motionStyle ?? DEFAULT_MOTION_STYLE) === config.motionStyle
        && (section?.sidebarMotionEnabled ?? true) === config.sidebarMotionEnabled
        && (section?.sidebarMotionStyle ?? DEFAULT_SIDEBAR_MOTION_STYLE) === config.sidebarMotionStyle
        && (section?.selectionMotionEnabled ?? true) === config.selectionMotionEnabled
        && (section?.newChatMotionEnabled ?? true) === config.newChatMotionEnabled
        && (section?.newChatMotionStyle ?? DEFAULT_NEW_CHAT_MOTION_STYLE) === config.newChatMotionStyle
        && (section?.settingsMotionEnabled ?? true) === config.settingsMotionEnabled;
}
/**
 * Render the motion settings section content.
 * @param props - composed Settings slot props.
 */
export function MotionSection({ useMotion, setMotionEnabled, setMotionStyle, setSidebarMotionEnabled, setSidebarMotionStyle, setSelectionMotionEnabled, setNewChatMotionEnabled, setNewChatMotionStyle, setSettingsMotionEnabled, applyMotionPreset, t, }) {
    const scope = useMotion((value) => value);
    const enabled = scope?.value?.motionEnabled ?? true;
    const sidebarEnabled = scope?.value?.sidebarMotionEnabled ?? true;
    const selectionEnabled = scope?.value?.selectionMotionEnabled ?? true;
    const newChatEnabled = scope?.value?.newChatMotionEnabled ?? true;
    const settingsEnabled = scope?.value?.settingsMotionEnabled ?? true;
    const newChatStyle = isNewChatMotionStyle(scope?.value?.newChatMotionStyle)
        ? scope.value.newChatMotionStyle
        : DEFAULT_NEW_CHAT_MOTION_STYLE;
    const style = isMotionStyle(scope?.value?.motionStyle) ? scope.value.motionStyle : DEFAULT_MOTION_STYLE;
    const sidebarStyle = isSidebarMotionStyle(scope?.value?.sidebarMotionStyle)
        ? scope.value.sidebarMotionStyle
        : DEFAULT_SIDEBAR_MOTION_STYLE;
    const [open, setOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newChatOpen, setNewChatOpen] = useState(false);
    const translator = t;
    const selectedLabel = (STYLE_OPTIONS.find(option => option.id === style) ?? STYLE_OPTIONS[0]).label;
    const sidebarSelectedLabel = (SIDEBAR_OPTIONS.find(option => option.id === sidebarStyle) ?? SIDEBAR_OPTIONS[0]).label;
    const newChatSelectedLabel = (NEW_CHAT_OPTIONS.find(option => option.id === newChatStyle) ?? NEW_CHAT_OPTIONS[0]).label;
    return (_jsxs("div", { className: css.section, children: [_jsx("h2", { className: css.heading, children: translator('title') }), _jsx("p", { className: css.intro, children: translator('intro') }), _jsxs("div", { className: `${css.row} ${css.rowDivider}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('presetTitle') }), _jsx("div", { className: css.desc, children: translator('presetDesc') })] }), _jsx("div", { className: css.presets, role: "group", "aria-label": translator('presetTitle'), children: MOTION_PRESETS.map((preset) => {
                            const meta = PRESET_META[preset.id];
                            if (meta === undefined)
                                return null;
                            return (_jsx("button", { type: "button", className: `${css.preset} ${matchesPreset(scope?.value, preset.config) ? css.presetActive : ''}`, "aria-pressed": matchesPreset(scope?.value, preset.config), title: translator(meta.desc), onClick: () => applyMotionPreset(preset.id), children: translator(meta.label) }, preset.id));
                        }) })] }), _jsxs("div", { className: `${css.row} ${enabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('toggleTitle') }), _jsx("div", { className: css.desc, children: translator('toggleDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('toggleTitle'), checked: enabled, onChange: (event) => setMotionEnabled(event.target.checked) }) })] }), _jsxs("div", { className: `${css.row} ${css.rowDivider} ${enabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('styleTitle') }), _jsx("div", { className: css.desc, children: translator('styleDesc') })] }), _jsx(Menu, { open: open, onClose: () => { setOpen(false); }, items: STYLE_OPTIONS.map(option => ({ id: option.id, label: translator(option.label) })), selectedId: style, onSelect: (id) => {
                            setOpen(false);
                            // Guard the Menu's free-form id before it lands in the settings doc.
                            if (isMotionStyle(id))
                                setMotionStyle(id);
                        }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, disabled: !enabled, "aria-haspopup": "menu", "aria-expanded": open, onClick: () => { setOpen(value => !value); }, children: [translator(selectedLabel), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) })] }), _jsxs("div", { className: `${css.row} ${css.rowDivider} ${enabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('sidebarToggleTitle') }), _jsx("div", { className: css.desc, children: translator('sidebarToggleDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('sidebarToggleTitle'), checked: sidebarEnabled, disabled: !enabled, onChange: (event) => setSidebarMotionEnabled(event.target.checked) }) })] }), _jsxs("div", { className: `${css.row} ${enabled && sidebarEnabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('sidebarStyleTitle') }), _jsx("div", { className: css.desc, children: translator('sidebarStyleDesc') })] }), _jsx(Menu, { open: sidebarOpen, onClose: () => { setSidebarOpen(false); }, items: SIDEBAR_OPTIONS.map(option => ({ id: option.id, label: translator(option.label) })), selectedId: sidebarStyle, onSelect: (id) => {
                            setSidebarOpen(false);
                            // Guard the Menu's free-form id before it lands in the settings doc.
                            if (isSidebarMotionStyle(id))
                                setSidebarMotionStyle(id);
                        }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, disabled: !enabled || !sidebarEnabled, "aria-haspopup": "menu", "aria-expanded": sidebarOpen, onClick: () => { setSidebarOpen(value => !value); }, children: [translator(sidebarSelectedLabel), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) })] }), _jsxs("div", { className: `${css.row} ${css.rowDivider} ${enabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('selectionToggleTitle') }), _jsx("div", { className: css.desc, children: translator('selectionToggleDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('selectionToggleTitle'), checked: selectionEnabled, disabled: !enabled, onChange: (event) => setSelectionMotionEnabled(event.target.checked) }) })] }), _jsxs("div", { className: `${css.row} ${enabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('newChatToggleTitle') }), _jsx("div", { className: css.desc, children: translator('newChatToggleDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('newChatToggleTitle'), checked: newChatEnabled, disabled: !enabled, onChange: (event) => setNewChatMotionEnabled(event.target.checked) }) })] }), _jsxs("div", { className: `${css.row} ${enabled && newChatEnabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('newChatStyleTitle') }), _jsx("div", { className: css.desc, children: translator('newChatStyleDesc') })] }), _jsx(Menu, { open: newChatOpen, onClose: () => { setNewChatOpen(false); }, items: NEW_CHAT_OPTIONS.map(option => ({ id: option.id, label: translator(option.label) })), selectedId: newChatStyle, onSelect: (id) => {
                            setNewChatOpen(false);
                            // Guard the Menu's free-form id before it lands in the settings doc.
                            if (isNewChatMotionStyle(id))
                                setNewChatMotionStyle(id);
                        }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.selector, disabled: !enabled || !newChatEnabled, "aria-haspopup": "menu", "aria-expanded": newChatOpen, onClick: () => { setNewChatOpen(value => !value); }, children: [translator(newChatSelectedLabel), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) })] }), _jsxs("div", { className: `${css.row} ${css.rowDivider} ${enabled ? '' : css.rowDisabled}`, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: translator('settingsToggleTitle') }), _jsx("div", { className: css.desc, children: translator('settingsToggleDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('settingsToggleTitle'), checked: settingsEnabled, disabled: !enabled, onChange: (event) => setSettingsMotionEnabled(event.target.checked) }) })] })] }));
}
//# sourceMappingURL=MotionSection.js.map