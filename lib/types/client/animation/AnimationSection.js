import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './AnimationSection.module.css';
/** Style options in display order. */
const STYLES = [
    { id: 'soft', label: 'style.soft', desc: 'style.softDesc' },
    { id: 'standard', label: 'style.standard', desc: 'style.standardDesc' },
    { id: 'lively', label: 'style.lively', desc: 'style.livelyDesc' },
];
/** Preset options in display order. */
const PRESETS = [
    { id: 'balanced', label: 'preset.balanced', desc: 'preset.balancedDesc' },
    { id: 'focus', label: 'preset.focus', desc: 'preset.focusDesc' },
];
/**
 * Render the motion section content.
 * @param props - composed slot props + injected controller face.
 */
export function AnimationSection({ t, useAnimation, setEnabled, setStyle, setPreset, }) {
    const scope = useAnimation((value) => value);
    const value = scope?.value;
    const translator = t;
    const enabled = value?.animationEnabled ?? true;
    const style = value?.animationStyle ?? 'standard';
    const preset = value?.animationPreset ?? 'balanced';
    return (_jsxs("div", { className: css.section, "data-dsu-motion": "fade-up", children: [_jsx("h2", { className: css.heading, children: translator('title') }), _jsx("p", { className: css.intro, children: translator('intro') }), _jsxs("div", { className: css.switchRow, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.rowTitle, children: translator('enabled') }), _jsx("p", { className: css.rowDesc, children: translator('enabledDesc') })] }), _jsx("label", { className: css.switch, children: _jsx("input", { type: "checkbox", className: css.checkbox, "aria-label": translator('enabled'), checked: enabled, onChange: (event) => setEnabled(event.target.checked) }) })] }), _jsxs("div", { className: css.row, children: [_jsx("div", { className: css.rowTitle, children: translator('style') }), _jsx("p", { className: css.rowDesc, children: translator('styleDesc') }), _jsx("div", { className: css.options, children: STYLES.map((option) => (_jsxs("button", { type: "button", className: `${css.option}${style === option.id ? ` ${css.optionActive}` : ''}`, "aria-pressed": style === option.id, onClick: () => setStyle(option.id), children: [_jsxs("span", { className: css.optionLabel, children: [_jsx("span", { className: css.optionName, children: translator(option.label) }), _jsx("span", { className: css.optionDesc, children: translator(option.desc) })] }), style === option.id ? _jsx("span", { className: css.check, children: "\u2713" }) : null] }, option.id))) })] }), _jsxs("div", { className: css.row, children: [_jsx("div", { className: css.rowTitle, children: translator('preset') }), _jsx("p", { className: css.rowDesc, children: translator('presetDesc') }), _jsx("div", { className: css.options, children: PRESETS.map((option) => (_jsxs("button", { type: "button", className: `${css.option}${preset === option.id ? ` ${css.optionActive}` : ''}`, "aria-pressed": preset === option.id, onClick: () => setPreset(option.id), children: [_jsxs("span", { className: css.optionLabel, children: [_jsx("span", { className: css.optionName, children: translator(option.label) }), _jsx("span", { className: css.optionDesc, children: translator(option.desc) })] }), preset === option.id ? _jsx("span", { className: css.check, children: "\u2713" }) : null] }, option.id))) })] })] }));
}
//# sourceMappingURL=AnimationSection.js.map