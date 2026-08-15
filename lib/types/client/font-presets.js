/** The stock look: no override, the theme's own stacks win. */
const DEFAULT_PRESET = {
    id: 'default',
    name: '默认',
    description: '跟随系统与主题默认字体，不做替换。',
    uiFont: '',
    codeFont: '',
};
/** HarmonyOS Sans (SC 版覆盖中文) + 鸿蒙等宽，清爽克制。 */
const HARMONY = {
    id: 'harmony',
    name: '鸿蒙',
    description: 'HarmonyOS Sans 界面 + 鸿蒙等宽代码，清爽克制。',
    uiFont: "'HarmonyOS Sans SC', 'HarmonyOS Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif",
    codeFont: "'HarmonyOS Sans Mono', 'JetBrains Mono', 'Cascadia Code', Consolas, 'PingFang SC', monospace",
};
/** 小米 MiSans（中文优化）+ JetBrains Mono，现代利落。 */
const MISANS = {
    id: 'misans',
    name: '米思',
    description: 'MiSans 界面 + JetBrains Mono 代码，现代利落。',
    uiFont: "'MiSans', 'HarmonyOS Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    codeFont: "'JetBrains Mono', 'Cascadia Code', Consolas, 'MiSans', monospace",
};
/** 霞鹜文楷：楷体装饰风界面 + 文楷等宽代码，温润书卷气。 */
const LXGW = {
    id: 'lxgw',
    name: '文楷',
    description: '霞鹜文楷界面（楷体装饰风）+ 文楷等宽代码，温润书卷气。',
    uiFont: "'LXGW WenKai', '霞鹜文楷', 'Kaiti SC', 'STKaiti', 'KaiTi', serif",
    codeFont: "'LXGW WenKai Mono', 'LXGW WenKai', 'JetBrains Mono', Consolas, monospace",
};
/** 思源黑体（Noto/Source Han Sans SC）+ Fira Code，稳重清晰。 */
const SOURCE_HAN = {
    id: 'source-han',
    name: '思源',
    description: '思源黑体（Noto Sans SC）界面 + Fira Code 代码，稳重清晰。',
    uiFont: "'Source Han Sans SC', 'Noto Sans SC', 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    codeFont: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, 'Noto Sans SC', monospace",
};
/** All shipped font pairings, in display order. */
export const FONT_PRESETS = [
    DEFAULT_PRESET, HARMONY, MISANS, LXGW, SOURCE_HAN,
];
/** Id → font-preset lookup. */
export const FONT_PRESET_MAP = new Map(FONT_PRESETS.map((preset) => [preset.id, preset]));
/**
 * Resolve a font pairing to its theme fields.
 * @param id - preset id ('' / unknown / 'default' resolve to the neutral pair).
 * @returns the partial config fields for `fontFamily` / `codeFontFamily`.
 */
export function resolveFontPreset(id) {
    const preset = (id === undefined || id === '' ? undefined : FONT_PRESET_MAP.get(id)) ?? DEFAULT_PRESET;
    return { fontFamily: preset.uiFont, codeFontFamily: preset.codeFont };
}
//# sourceMappingURL=font-presets.js.map