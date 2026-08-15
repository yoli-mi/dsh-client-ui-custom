import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './AppearancePreview.module.css';
const cleanString = (value, fallback) => typeof value === 'string' && value !== '' ? value : fallback;
const toNumber = (value, fallback) => typeof value === 'number' ? value : fallback;
/** Mini interface mock reflecting the staged draft. */
export function AppearancePreview({ draft }) {
    const accent = cleanString(draft.accent, '#4176e6');
    const gradient = cleanString(draft.gradient, '');
    const wallpaper = cleanString(draft.wallpaper, '');
    const fontFamily = cleanString(draft.fontFamily, '');
    const codeFont = cleanString(draft.codeFontFamily, '');
    const scale = toNumber(draft.fontScale, 1);
    const scrim = toNumber(draft.darkScrim, 0);
    // Font sizes scale with the 字号缩放 knob so the mock shows the effect.
    const px = (n) => `${Math.round(n * scale)}px`;
    const layers = [];
    if (gradient !== '')
        layers.push(gradient);
    if (wallpaper !== '')
        layers.push(`url("${wallpaper.replaceAll('"', '\\"')}")`);
    const backgroundImage = layers.length > 0 ? layers.join(', ') : undefined;
    const alpha = (value, fallback) => {
        const n = toNumber(value, fallback);
        return `color-mix(in srgb, var(--pv-base) ${Math.max(4, Math.min(100, n))}%, transparent)`;
    };
    return (_jsxs("div", { className: css.mock, style: {
            ['--pv-accent']: accent,
            ['--pv-scrim']: `${scrim}%`,
            ['--pv-surface']: alpha(draft.surfaceOpacity, 100),
            ['--pv-chat']: alpha(draft.chatSurfaceOpacity, 100),
            ['--pv-input']: alpha(draft.inputOpacity, 100),
            ['--pv-sidebar']: alpha(draft.sidebarOpacity, 100),
            backgroundImage,
            fontFamily: fontFamily !== '' ? fontFamily : undefined,
        }, children: [_jsx("span", { className: css.scrim }), _jsxs("div", { className: css.window, style: { fontSize: px(10) }, children: [_jsxs("div", { className: css.sidebar, style: { background: 'var(--pv-sidebar)' }, children: [_jsx("span", { className: css.navDot, style: { background: accent } }), _jsx("span", { className: css.line }), _jsx("span", { className: css.line, style: { width: '70%' } }), _jsx("span", { className: css.navActive, style: { background: accent } })] }), _jsxs("div", { className: css.main, children: [_jsxs("div", { className: css.topbar, children: [_jsx("span", { className: css.title, style: { fontFamily: codeFont !== '' ? codeFont : undefined }, children: "ui-custom" }), _jsx("span", { className: css.badge, style: { background: accent, color: '#fff' }, children: "\u9884\u89C8" })] }), _jsxs("div", { className: css.chat, style: { background: 'var(--pv-chat)' }, children: [_jsx("div", { className: css.bubbleLeft }), _jsx("div", { className: css.bubbleRight, style: { borderColor: accent } }), _jsx("div", { className: css.bubbleLeft, style: { width: '62%' } })] }), _jsxs("div", { className: css.inputRow, children: [_jsx("span", { className: css.inputField, style: { background: 'var(--pv-input)' } }), _jsx("span", { className: css.send, style: { background: accent } })] })] })] })] }));
}
//# sourceMappingURL=AppearancePreview.js.map