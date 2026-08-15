/** 实时预览：迷你界面缩略图，随外观草稿参数即时变化（背景渐变/壁纸、强调色、
 * 表面不透明度、字体与字号缩放、暗色遮罩）。纯展示组件 —— 从 draft 直接渲染。 */

import type { ThemeSection } from '../../shared.ts'
import css from './AppearancePreview.module.css'

const cleanString = (value: string | undefined, fallback: string): string =>
  typeof value === 'string' && value !== '' ? value : fallback
const toNumber = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' ? value : fallback

/** Mini interface mock reflecting the staged draft. */
export function AppearancePreview({ draft }: { draft: ThemeSection }) {
  const accent = cleanString(draft.accent, '#4176e6')
  const gradient = cleanString(draft.gradient, '')
  const wallpaper = cleanString(draft.wallpaper, '')
  const fontFamily = cleanString(draft.fontFamily, '')
  const codeFont = cleanString(draft.codeFontFamily, '')
  const scale = toNumber(draft.fontScale, 1)
  const scrim = toNumber(draft.darkScrim, 0)

  // Font sizes scale with the 字号缩放 knob so the mock shows the effect.
  const px = (n: number): string => `${Math.round(n * scale)}px`

  const layers: string[] = []
  if (gradient !== '') layers.push(gradient)
  if (wallpaper !== '') layers.push(`url("${wallpaper.replaceAll('"', '\\"')}")`)
  const backgroundImage = layers.length > 0 ? layers.join(', ') : undefined

  const alpha = (value: number | undefined, fallback: number): string => {
    const n = toNumber(value, fallback)
    return `color-mix(in srgb, var(--pv-base) ${Math.max(4, Math.min(100, n))}%, transparent)`
  }

  return (
    <div
      className={css.mock}
      style={{
        ['--pv-accent' as string]: accent,
        ['--pv-scrim' as string]: `${scrim}%`,
        ['--pv-surface' as string]: alpha(draft.surfaceOpacity, 100),
        ['--pv-chat' as string]: alpha(draft.chatSurfaceOpacity, 100),
        ['--pv-input' as string]: alpha(draft.inputOpacity, 100),
        ['--pv-sidebar' as string]: alpha(draft.sidebarOpacity, 100),
        backgroundImage,
        fontFamily: fontFamily !== '' ? fontFamily : undefined,
      }}
    >
      {/* dark-mode scrim overlay (only shown when the app is in dark theme) */}
      <span className={css.scrim} />
      <div className={css.window} style={{ fontSize: px(10) }}>
        {/* sidebar */}
        <div className={css.sidebar} style={{ background: 'var(--pv-sidebar)' }}>
          <span className={css.navDot} style={{ background: accent }} />
          <span className={css.line} />
          <span className={css.line} style={{ width: '70%' }} />
          <span className={css.navActive} style={{ background: accent }} />
        </div>
        {/* main */}
        <div className={css.main}>
          <div className={css.topbar}>
            <span className={css.title} style={{ fontFamily: codeFont !== '' ? codeFont : undefined }}>ui-custom</span>
            <span className={css.badge} style={{ background: accent, color: '#fff' }}>预览</span>
          </div>
          <div className={css.chat} style={{ background: 'var(--pv-chat)' }}>
            <div className={css.bubbleLeft} />
            <div className={css.bubbleRight} style={{ borderColor: accent }} />
            <div className={css.bubbleLeft} style={{ width: '62%' }} />
          </div>
          <div className={css.inputRow}>
            <span className={css.inputField} style={{ background: 'var(--pv-input)' }} />
            <span className={css.send} style={{ background: accent }} />
          </div>
        </div>
      </div>
    </div>
  )
}
