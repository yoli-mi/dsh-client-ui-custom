import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** The 外观 settings section: theme preference (merged) + art customization form. */
import { useMemo, useState } from 'react';
import { harmonySwatches } from "../color.js";
import { PRESETS } from "../presets.js";
import { FONT_PRESETS } from "../font-presets.js";
import { AppearancePreview } from "./AppearancePreview.js";
import css from './AppearanceSection.module.css';
const GLASS_OPTIONS = [
    { id: 'off', label: 'glass.off' },
    { id: 'light', label: 'glass.light' },
    { id: 'frosted', label: 'glass.frosted' },
    { id: 'mica', label: 'glass.mica' },
];
const SLIDERS = [
    { field: 'surfaceOpacity', label: 'surfaceOpacity' },
    { field: 'sidebarOpacity', label: 'sidebarOpacity' },
    { field: 'chatSurfaceOpacity', label: 'chatSurfaceOpacity' },
    { field: 'inputOpacity', label: 'inputOpacity' },
    { field: 'codeBlockOpacity', label: 'codeBlockOpacity' },
    { field: 'darkSurfaceOpacity', label: 'darkSurfaceOpacity' },
];
const CORNER_RADIUS_OPTIONS = [
    { id: 'inherit', label: 'radius.inherit' },
    { id: 'sm', label: 'radius.sm' },
    { id: 'md', label: 'radius.md' },
    { id: 'lg', label: 'radius.lg' },
    { id: 'xl', label: 'radius.xl' },
];
const SHADOW_OPTIONS = [
    { id: 'inherit', label: 'shadow.inherit' },
    { id: 'none', label: 'shadow.none' },
    { id: 'soft', label: 'shadow.soft' },
    { id: 'medium', label: 'shadow.medium' },
    { id: 'strong', label: 'shadow.strong' },
];
const TONE_OPTIONS = [
    { id: 'inherit', label: 'tone.inherit' },
    { id: 'soft', label: 'tone.soft' },
    { id: 'dim', label: 'tone.dim' },
    { id: 'bright', label: 'tone.bright' },
];
/** Mini color preview for a preset (accent-graded wash; gradient when shipped). */
const presetPreviewBackground = (config) => {
    const accent = typeof config.accent === 'string' && config.accent !== ''
        ? config.accent
        : '#4176e6';
    if (typeof config.gradient === 'string' && config.gradient !== '') {
        return config.gradient;
    }
    return `linear-gradient(135deg, ${accent}, ${accent}55)`;
};
/** One parameter-group card with a "恢复本组默认" action. */
function GroupCard({ title, resetLabel, group, writable, onReset, children, }) {
    return (_jsxs("div", { className: css.card, children: [_jsxs("div", { className: css.groupHeader, children: [_jsx("h3", { className: css.cardTitle, children: title }), _jsx("button", { type: "button", className: css.groupReset, disabled: !writable, onClick: () => onReset(group), children: resetLabel })] }), children] }));
}
/**
 * Render the appearance section content.
 * @param props - composed slot props + injected controller face.
 * @returns the section element tree.
 */
export function AppearanceSection({ t, useAppearance, setField, applyFontPreset, randomInspiration, resetGroup, preview, applyPreset, saveMyPreset, removeMyPreset, applyMyPreset, cancelPreview, save, resetAll, renderSlot, close, }) {
    const state = useAppearance((value) => value);
    const translator = t;
    const draft = state.draft;
    const [presetName, setPresetName] = useState('');
    const num = (field, fallback) => typeof draft[field] === 'number' ? draft[field] : fallback;
    const str = (field, fallback) => typeof draft[field] === 'string' ? draft[field] : fallback;
    const bool = (field, fallback) => typeof draft[field] === 'boolean' ? draft[field] : fallback;
    // One-click harmony swatches derived from the current accent (Material-You
    // style); picking one stages the accent without saving.
    const accent = str('accent', '#4176e6');
    const swatches = useMemo(() => harmonySwatches(accent), [accent]);
    // A preset click stages its config into the form — the wallpaper clears and
    // the fields fill in, but nothing is applied yet. The user then previews
    // through the shared 预览 button, exactly like any manual edit (one unified
    // preview path); save persists it, cancelPreview reverts.
    const handlePreset = (id) => {
        applyPreset(id);
    };
    const handleMyPreset = (id) => {
        applyMyPreset(id);
    };
    const handleSaveMyPreset = () => {
        saveMyPreset(presetName);
        setPresetName('');
    };
    // The preview button applies the staged draft to the document and closes the
    // settings dialog: the user is dropped into a full-app preview with a
    // floating bar (F2 returns to settings; Apply persists, Cancel reverts).
    const handlePreview = () => {
        preview();
        close();
    };
    // Which font pairing the staged stacks currently match ('' = none).
    const fontPresetId = FONT_PRESETS.find((preset) => preset.uiFont === str('fontFamily', '') && preset.codeFont === str('codeFontFamily', ''))?.id ?? '__custom__';
    if (state.status === 'unavailable') {
        return (_jsxs("div", { className: css.section, "data-dsu-motion": "fade-up", children: [_jsx("h2", { className: css.heading, children: translator('title') }), _jsx("p", { className: css.intro, children: translator('unavailable') }), _jsx("p", { className: css.hint, children: translator('unavailableHint') })] }));
    }
    return (_jsxs("div", { className: css.section, "data-dsu-motion": "fade-up", children: [_jsx("h2", { className: css.heading, children: translator('title') }), _jsx("p", { className: css.intro, children: translator('intro') }), _jsx("div", { className: css.preference, children: renderSlot('settings.appearance.item', {}) }), _jsxs("div", { className: css.card, children: [_jsxs("div", { className: css.groupHeader, children: [_jsx("h3", { className: css.cardTitle, children: translator('previewTitle') }), _jsx("button", { type: "button", className: css.inspire, disabled: !state.writable, onClick: randomInspiration, children: translator('randomInspiration') })] }), _jsx(AppearancePreview, { draft: draft }), _jsx("p", { className: css.hint, children: translator('previewHint') })] }), _jsxs("div", { className: css.card, children: [_jsx("h3", { className: css.cardTitle, children: translator('presetTitle') }), _jsx("p", { className: css.hint, children: translator('presetHint') }), _jsx("div", { className: css.presetGrid, children: PRESETS.map((preset) => {
                            const active = state.activePreset?.kind === 'shipped' && state.activePreset.id === preset.id;
                            return (_jsxs("button", { type: "button", className: `${css.presetCard}${active ? ` ${css.presetCardActive}` : ''}`, disabled: !state.writable, onClick: () => handlePreset(preset.id), children: [_jsx("span", { className: css.presetPreview, style: { background: presetPreviewBackground(preset.config) } }), _jsx("span", { className: css.presetName, children: preset.name }), active ? _jsx("span", { className: css.presetBadge, children: translator('activePreset') }) : null, _jsx("span", { className: css.presetDesc, children: preset.description })] }, preset.id));
                        }) }), _jsxs("div", { className: css.presetSaveRow, children: [_jsx("input", { className: css.presetNameInput, type: "text", value: presetName, placeholder: translator('myPresetName'), disabled: !state.writable, onChange: (event) => setPresetName(event.target.value), onKeyDown: (event) => { if (event.key === 'Enter')
                                    handleSaveMyPreset(); } }), _jsx("button", { type: "button", className: css.presetSave, disabled: !state.writable || presetName.trim() === '', onClick: handleSaveMyPreset, children: translator('saveMyPreset') })] }), state.myPresets.length > 0 && (_jsx("div", { className: css.presetGrid, children: state.myPresets.map((preset) => {
                            const active = state.activePreset?.kind === 'my' && state.activePreset.id === preset.id;
                            return (_jsxs("div", { className: `${css.presetCard}${active ? ` ${css.presetCardActive}` : ''}`, role: "button", tabIndex: 0, onClick: () => handleMyPreset(preset.id), children: [_jsx("span", { className: css.presetPreview, style: { background: presetPreviewBackground(preset.config) } }), _jsx("span", { className: css.presetName, children: preset.name }), active ? _jsx("span", { className: css.presetBadge, children: translator('activePreset') }) : null, _jsx("button", { type: "button", className: css.presetRemove, "aria-label": translator('removeMyPreset'), onClick: (event) => { event.stopPropagation(); removeMyPreset(preset.id); }, children: "\u2715" })] }, preset.id));
                        }) }))] }), _jsxs(GroupCard, { title: translator('groupBackground'), resetLabel: translator('groupReset'), group: "background", writable: state.writable, onReset: resetGroup, children: [_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-wallpaper", children: translator('wallpaper') }), _jsx("input", { id: "appearance-wallpaper", className: css.text, type: "text", value: str('wallpaper', ''), disabled: !state.writable, onChange: (event) => setField('wallpaper', event.target.value) }), _jsx("p", { className: css.hint, children: translator('wallpaperHint') })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-glass", children: translator('glass') }), _jsx("select", { id: "appearance-glass", className: css.select, value: str('glass', 'frosted'), disabled: !state.writable, onChange: (event) => setField('glass', event.target.value), children: GLASS_OPTIONS.map((option) => (_jsx("option", { value: option.id, children: translator(option.label) }, option.id))) })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-gradient", children: translator('gradient') }), _jsx("input", { id: "appearance-gradient", className: css.text, type: "text", value: str('gradient', ''), disabled: !state.writable, onChange: (event) => setField('gradient', event.target.value) }), _jsx("p", { className: css.hint, children: translator('gradientHint') })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-darkScrim", children: translator('darkScrim') }), _jsxs("span", { className: css.slider, children: [_jsx("input", { id: "appearance-darkScrim", className: css.range, type: "range", min: 0, max: 100, value: num('darkScrim', 0), style: { ['--fill']: `${num('darkScrim', 0)}%` }, disabled: !state.writable, onChange: (event) => setField('darkScrim', Number(event.target.value)) }), _jsxs("span", { className: css.rangeValue, children: [num('darkScrim', 0), "%"] })] })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-wallpaperTone", children: translator('wallpaperTone') }), _jsx("select", { id: "appearance-wallpaperTone", className: css.select, value: str('wallpaperTone', 'inherit'), disabled: !state.writable, onChange: (event) => setField('wallpaperTone', event.target.value), children: TONE_OPTIONS.map((option) => (_jsx("option", { value: option.id, children: translator(option.label) }, option.id))) })] })] }), _jsxs(GroupCard, { title: translator('groupColor'), resetLabel: translator('groupReset'), group: "color", writable: state.writable, onReset: resetGroup, children: [_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-accent", children: translator('accent') }), _jsxs("span", { className: css.slider, children: [_jsx("input", { id: "appearance-accent", className: css.color, type: "color", value: accent, disabled: !state.writable, onChange: (event) => setField('accent', event.target.value) }), _jsx("input", { className: css.text, type: "text", value: accent, disabled: !state.writable, onChange: (event) => setField('accent', event.target.value) })] })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, children: translator('accentPalette') }), _jsx("span", { className: css.swatches, children: swatches.map((color) => (_jsx("button", { type: "button", className: css.swatch, style: { background: color }, title: color, "aria-label": color, disabled: !state.writable, onClick: () => setField('accent', color) }, color))) }), _jsx("p", { className: css.hint, children: translator('accentPaletteHint') })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-autoAccent", children: translator('autoAccent') }), _jsx("span", { className: css.check, children: _jsx("input", { id: "appearance-autoAccent", className: css.checkbox, type: "checkbox", checked: bool('autoAccent', false), disabled: !state.writable, onChange: (event) => setField('autoAccent', event.target.checked) }) })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-darkAccent", children: translator('darkAccent') }), _jsxs("span", { className: css.slider, children: [_jsx("input", { id: "appearance-darkAccent", className: css.color, type: "color", value: str('darkAccent', '') || '#4176e6', disabled: !state.writable, onChange: (event) => setField('darkAccent', event.target.value) }), _jsx("input", { className: css.text, type: "text", value: str('darkAccent', ''), placeholder: translator('darkAccentPlaceholder'), disabled: !state.writable, onChange: (event) => setField('darkAccent', event.target.value) })] }), _jsx("p", { className: css.hint, children: translator('darkAccentHint') })] })] }), _jsx(GroupCard, { title: translator('groupSurface'), resetLabel: translator('groupReset'), group: "surface", writable: state.writable, onReset: resetGroup, children: SLIDERS.map((slider) => (_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: `appearance-${slider.field}`, children: translator(slider.label) }), _jsxs("span", { className: css.slider, children: [_jsx("input", { id: `appearance-${slider.field}`, className: css.range, type: "range", min: 0, max: 100, value: num(slider.field, 100), style: { ['--fill']: `${num(slider.field, 100)}%` }, disabled: !state.writable, onChange: (event) => setField(slider.field, Number(event.target.value)) }), _jsxs("span", { className: css.rangeValue, children: [num(slider.field, 100), "%"] })] })] }, slider.field))) }), _jsxs(GroupCard, { title: translator('groupTypography'), resetLabel: translator('groupReset'), group: "typography", writable: state.writable, onReset: resetGroup, children: [_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-fontPreset", children: translator('fontPreset') }), _jsxs("select", { id: "appearance-fontPreset", className: css.select, value: fontPresetId, disabled: !state.writable, onChange: (event) => { if (event.target.value !== '__custom__')
                                    applyFontPreset(event.target.value); }, children: [FONT_PRESETS.map((preset) => (_jsx("option", { value: preset.id, children: preset.name }, preset.id))), _jsx("option", { value: "__custom__", children: translator('fontCustom') })] }), _jsx("p", { className: css.hint, children: translator('fontPresetHint') })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-font", children: translator('fontFamily') }), _jsx("input", { id: "appearance-font", className: css.text, type: "text", value: str('fontFamily', ''), disabled: !state.writable, onChange: (event) => setField('fontFamily', event.target.value) })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-codeFont", children: translator('codeFontFamily') }), _jsx("input", { id: "appearance-codeFont", className: css.text, type: "text", value: str('codeFontFamily', ''), disabled: !state.writable, onChange: (event) => setField('codeFontFamily', event.target.value) })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-fontScale", children: translator('fontScale') }), _jsxs("span", { className: css.slider, children: [_jsx("input", { id: "appearance-fontScale", className: css.range, type: "range", min: 0.9, max: 1.1, step: 0.05, value: num('fontScale', 1), style: { ['--fill']: `${((num('fontScale', 1) - 0.9) / 0.2) * 100}%` }, disabled: !state.writable, onChange: (event) => setField('fontScale', Number(event.target.value)) }), _jsxs("span", { className: css.rangeValue, children: ["\u00D7", num('fontScale', 1).toFixed(2)] })] }), _jsx("p", { className: css.hint, children: translator('fontScaleHint') })] })] }), _jsxs(GroupCard, { title: translator('refineTitle'), resetLabel: translator('groupReset'), group: "refine", writable: state.writable, onReset: resetGroup, children: [_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-cornerRadius", children: translator('cornerRadius') }), _jsx("select", { id: "appearance-cornerRadius", className: css.select, value: str('cornerRadius', 'inherit'), disabled: !state.writable, onChange: (event) => setField('cornerRadius', event.target.value), children: CORNER_RADIUS_OPTIONS.map((option) => (_jsx("option", { value: option.id, children: translator(option.label) }, option.id))) })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-surfaceShadow", children: translator('surfaceShadow') }), _jsx("select", { id: "appearance-surfaceShadow", className: css.select, value: str('surfaceShadow', 'inherit'), disabled: !state.writable, onChange: (event) => setField('surfaceShadow', event.target.value), children: SHADOW_OPTIONS.map((option) => (_jsx("option", { value: option.id, children: translator(option.label) }, option.id))) })] }), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "appearance-focusGlow", children: translator('focusGlow') }), _jsx("span", { className: css.check, children: _jsx("input", { id: "appearance-focusGlow", className: css.checkbox, type: "checkbox", checked: str('focusGlow', 'inherit') === 'on', disabled: !state.writable, onChange: (event) => setField('focusGlow', event.target.checked ? 'on' : 'inherit') }) })] }), ['scrollbarAccent', 'vignette'].map((field) => (_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: `appearance-${field}`, children: translator(field) }), _jsx("span", { className: css.check, children: _jsx("input", { id: `appearance-${field}`, className: css.checkbox, type: "checkbox", checked: bool(field, false), disabled: !state.writable, onChange: (event) => setField(field, event.target.checked) }) })] }, field)))] }), _jsxs("div", { className: css.footer, children: [state.dirty ? _jsx("span", { className: css.dirty, children: translator('dirty') }) : null, state.previewing ? _jsx("span", { className: css.previewing, children: translator('previewing') }) : null, _jsx("button", { type: "button", className: css.reset, disabled: !state.writable || state.saving, onClick: resetAll, children: translator('reset') }), state.previewing ? (_jsx("button", { type: "button", className: css.cancel, disabled: !state.writable || state.saving, onClick: cancelPreview, children: translator('cancelPreview') })) : (_jsx("button", { type: "button", className: css.preview, disabled: !state.dirty || !state.writable || state.saving, onClick: handlePreview, children: translator('preview') })), _jsx("button", { type: "button", className: css.save, disabled: !state.dirty || !state.writable || state.saving, onClick: save, children: state.saving ? translator('saving') : translator('save') })] })] }));
}
//# sourceMappingURL=AppearanceSection.js.map