/** Locale dictionaries for the appearance settings section (主题定制 + 外观偏好). */

/** Dictionary namespace owned by the appearance surface. */
export const APPEARANCE_NS = 'appearance'

/** All appearance copy keys. */
export type AppearanceKey =
  | 'nav' | 'title' | 'intro' | 'save' | 'saving' | 'reset' | 'dirty' | 'unavailable' | 'unavailableHint'
  | 'preview' | 'previewing' | 'cancelPreview'
  | 'wallpaper' | 'wallpaperHint' | 'glass' | 'glass.off' | 'glass.light' | 'glass.frosted' | 'glass.mica'
  | 'accent' | 'accentPalette' | 'accentPaletteHint' | 'autoAccent'
  | 'surfaceOpacity' | 'sidebarOpacity' | 'chatSurfaceOpacity' | 'inputOpacity' | 'codeBlockOpacity' | 'darkSurfaceOpacity'
  | 'gradient' | 'gradientHint' | 'darkScrim' | 'fontFamily' | 'codeFontFamily' | 'fontScale' | 'fontScaleHint' | 'scrollbarAccent' | 'vignette'
  | 'refineTitle' | 'cornerRadius' | 'radius.inherit' | 'radius.sm' | 'radius.md' | 'radius.lg' | 'radius.xl'
  | 'surfaceShadow' | 'shadow.inherit' | 'shadow.none' | 'shadow.soft' | 'shadow.medium' | 'shadow.strong'
  | 'wallpaperTone' | 'tone.inherit' | 'tone.soft' | 'tone.dim' | 'tone.bright'
  | 'darkAccent' | 'darkAccentHint' | 'darkAccentPlaceholder' | 'focusGlow'
  | 'presetTitle' | 'presetHint' | 'myPresetName' | 'saveMyPreset' | 'removeMyPreset'
  | 'activePreset'
  | 'previewTitle' | 'previewHint' | 'randomInspiration'
  | 'groupBackground' | 'groupColor' | 'groupSurface' | 'groupTypography' | 'groupReset'
  | 'fontPreset' | 'fontPresetHint' | 'fontCustom'
  | 'previewingBar'

/** Simplified Chinese copy. */
export const zh: Record<AppearanceKey, string> = {
  nav: '外观',
  title: '外观',
  intro: '主题偏好与美术定制：渐变底色、壁纸、毛玻璃、强调色、表面不透明度与暗色遮罩。改动保存后即时生效。',
  save: '保存',
  saving: '保存中…',
  reset: '恢复默认',
  dirty: '有未保存的修改',
  unavailable: '外观设置当前不可用',
  unavailableHint: '连接处于内存模式或该命名空间未对浏览器暴露。',
  wallpaper: '壁纸',
  wallpaperHint: 'URL 或 Web 可访问路径；留空 = 关闭壁纸。',
  glass: '玻璃档位',
  'glass.off': '不透明',
  'glass.light': '轻玻璃',
  'glass.frosted': '毛玻璃',
  'glass.mica': 'Mica',
  accent: '强调色',
  autoAccent: '从壁纸自动取色',
  surfaceOpacity: '主表面不透明度',
  sidebarOpacity: '侧栏不透明度',
  chatSurfaceOpacity: '聊天列不透明度',
  inputOpacity: '输入框不透明度',
  codeBlockOpacity: '代码块不透明度',
  darkSurfaceOpacity: '暗色表面不透明度',
  gradient: '色调渐变',
  gradientHint: 'CSS 渐变，作为主题底色；叠加在壁纸上（如有）。留空 = 无。',
  darkScrim: '暗色遮罩',
  fontFamily: '字体',
  codeFontFamily: '代码字体',
  fontScale: '字号缩放',
  fontScaleHint: '整体界面 0.9–1.1 倍缩放。',
  scrollbarAccent: '主题色滚动条',
  vignette: '内嵌晕影',
  preview: '预览',
  previewing: '预览中——满意后点「保存」，不满意点「取消预览」',
  cancelPreview: '取消预览',
  refineTitle: '质感',
  cornerRadius: '圆角',
  'radius.inherit': '跟随默认',
  'radius.sm': '小 (6px)',
  'radius.md': '中 (10px)',
  'radius.lg': '大 (14px)',
  'radius.xl': '超大 (18px)',
  surfaceShadow: '表面阴影',
  'shadow.inherit': '跟随默认',
  'shadow.none': '无阴影',
  'shadow.soft': '轻盈',
  'shadow.medium': '适中',
  'shadow.strong': '深邃',
  wallpaperTone: '壁纸调性',
  'tone.inherit': '原样',
  'tone.soft': '柔化',
  'tone.dim': '压暗',
  'tone.bright': '提亮',
  darkAccent: '暗色强调色',
  darkAccentHint: '留空 = 暗色模式跟随主强调色；设置后仅暗色模式使用该颜色。',
  darkAccentPlaceholder: '留空 = 跟随主强调色',
  focusGlow: '焦点光晕',
  accentPalette: '和谐色板',
  accentPaletteHint: '从当前强调色派生的一组邻近/互补/三角色，点击即可选用。',
  presetTitle: '一键预设',
  presetHint: '点击预设将方案载入下方设置项（壁纸清空，由渐变作为底色），点「预览」查看效果，点「保存」持久化，或点「取消预览」还原。',
  myPresetName: '给这个外观起个名字，存为我的预设',
  saveMyPreset: '另存为我的预设',
  removeMyPreset: '删除该预设',
  activePreset: '当前',
  previewTitle: '实时预览',
  previewHint: '迷你界面随下方参数实时变化；点「随机灵感」可生成一套和谐配色。',
  randomInspiration: '随机灵感',
  groupBackground: '背景',
  groupColor: '色彩',
  groupSurface: '表面',
  groupTypography: '排版',
  groupReset: '恢复本组默认',
  fontPreset: '字体搭配',
  fontPresetHint: '一键套用「界面字体 + 代码字体」组合；字体栈内已含中文字体建议，未安装的字体自动回退。',
  fontCustom: '自定义',
  previewingBar: '按 F2 退出预览',
}

/** English copy. */
export const en: Record<AppearanceKey, string> = {
  nav: 'Appearance',
  title: 'Appearance',
  intro: 'Theme preference and art customization: wallpaper, frosted glass, accent, surface opacity and dark scrim. Changes apply immediately on save.',
  save: 'Save',
  saving: 'Saving…',
  reset: 'Reset to defaults',
  dirty: 'Unsaved changes',
  unavailable: 'Appearance settings are unavailable',
  unavailableHint: 'The connection is in memory mode, or the namespace is not exposed to the browser.',
  wallpaper: 'Wallpaper',
  wallpaperHint: 'URL or web-served path; empty disables the wallpaper.',
  glass: 'Glass level',
  'glass.off': 'Opaque',
  'glass.light': 'Light',
  'glass.frosted': 'Frosted',
  'glass.mica': 'Mica',
  accent: 'Accent color',
  autoAccent: 'Auto accent from wallpaper',
  surfaceOpacity: 'Main surface opacity',
  sidebarOpacity: 'Sidebar opacity',
  chatSurfaceOpacity: 'Chat column opacity',
  inputOpacity: 'Input opacity',
  codeBlockOpacity: 'Code block opacity',
  darkSurfaceOpacity: 'Dark surface opacity',
  gradient: 'Tone gradient',
  gradientHint: 'CSS gradient wash as the theme base; layered over the wallpaper (if any). Empty = none.',
  darkScrim: 'Dark scrim',
  fontFamily: 'Font family',
  codeFontFamily: 'Code font',
  fontScale: 'Font scale',
  fontScaleHint: 'Scales the whole UI from 0.9× to 1.1×.',
  scrollbarAccent: 'Accent scrollbar',
  vignette: 'Vignette',
  preview: 'Preview',
  previewing: 'Previewing — click Save to keep, or Cancel preview to revert',
  cancelPreview: 'Cancel preview',
  refineTitle: 'Refinement (optional — nothing changes by default)',
  cornerRadius: 'Corner radius',
  'radius.inherit': 'Follow default',
  'radius.sm': 'Small (6px)',
  'radius.md': 'Medium (10px)',
  'radius.lg': 'Large (14px)',
  'radius.xl': 'Extra large (18px)',
  surfaceShadow: 'Surface shadow',
  'shadow.inherit': 'Follow default',
  'shadow.none': 'None',
  'shadow.soft': 'Soft',
  'shadow.medium': 'Medium',
  'shadow.strong': 'Strong',
  wallpaperTone: 'Wallpaper tone',
  'tone.inherit': 'Original',
  'tone.soft': 'Soft',
  'tone.dim': 'Dim',
  'tone.bright': 'Bright',
  darkAccent: 'Dark-mode accent',
  darkAccentHint: 'Empty inherits the main accent in dark mode; set to override it there only.',
  darkAccentPlaceholder: 'Empty = follow main accent',
  focusGlow: 'Focus glow',
  accentPalette: 'Harmony palette',
  accentPaletteHint: 'Neighboring / complementary / triadic shades derived from the accent — click to pick.',
  presetTitle: 'One-click presets',
  presetHint: 'Clicking a preset loads its scheme into the form below (the wallpaper clears so the gradient becomes the base); press Preview to see it, Save to persist, or Cancel preview to revert.',
  myPresetName: 'Name this look and save it as my preset',
  saveMyPreset: 'Save as my preset',
  removeMyPreset: 'Remove this preset',
  activePreset: 'Current',
  previewTitle: 'Live preview',
  previewHint: 'A mini UI that follows every parameter below in real time; hit Random inspiration for a harmonious palette.',
  randomInspiration: 'Random inspiration',
  groupBackground: 'Background',
  groupColor: 'Color',
  groupSurface: 'Surfaces',
  groupTypography: 'Typography',
  groupReset: 'Reset group',
  fontPreset: 'Font pairing',
  fontPresetHint: 'Apply a ui + code font pairing in one click; CJK stacks are built in, missing faces fall back automatically.',
  fontCustom: 'Custom',
  previewingBar: 'Press F2 to exit preview',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The appearance section copy. */
    appearance: AppearanceKey
  }
}
