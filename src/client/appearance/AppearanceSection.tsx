/** The 外观 settings section: theme preference (merged) + art customization form. */

import { useMemo, useState, type ReactNode } from 'react'
import type {
  InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, TranslateNS,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { AppearanceInjected, ParamGroup, ThemeField } from './controller.ts'
import { harmonySwatches } from '../color.ts'
import type { CustomThemeConfig } from '../config.ts'
import { PRESETS } from '../presets.ts'
import { FONT_PRESETS } from '../font-presets.ts'
import { AppearancePreview } from './AppearancePreview.tsx'
import css from './AppearanceSection.module.css'

/** Props the renderer binds for the section. */
export type AppearanceSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'appearance'>
  & PropsRenderSlots<'settings.appearance.item'>
  & InjectFace<AppearanceInjected>

const GLASS_OPTIONS: readonly { id: 'off' | 'light' | 'frosted' | 'mica'; label: 'glass.off' | 'glass.light' | 'glass.frosted' | 'glass.mica' }[] = [
  { id: 'off', label: 'glass.off' },
  { id: 'light', label: 'glass.light' },
  { id: 'frosted', label: 'glass.frosted' },
  { id: 'mica', label: 'glass.mica' },
]

const SLIDERS: readonly { field: ThemeField; label: AppearanceSliderKey }[] = [
  { field: 'surfaceOpacity', label: 'surfaceOpacity' },
  { field: 'sidebarOpacity', label: 'sidebarOpacity' },
  { field: 'chatSurfaceOpacity', label: 'chatSurfaceOpacity' },
  { field: 'inputOpacity', label: 'inputOpacity' },
  { field: 'codeBlockOpacity', label: 'codeBlockOpacity' },
  { field: 'darkSurfaceOpacity', label: 'darkSurfaceOpacity' },
]

type AppearanceSliderKey =
  | 'surfaceOpacity' | 'sidebarOpacity' | 'chatSurfaceOpacity'
  | 'inputOpacity' | 'codeBlockOpacity' | 'darkSurfaceOpacity' | 'darkScrim'

type RefineLabel =
  | 'radius.inherit' | 'radius.sm' | 'radius.md' | 'radius.lg' | 'radius.xl'
  | 'shadow.inherit' | 'shadow.none' | 'shadow.soft' | 'shadow.medium' | 'shadow.strong'
  | 'tone.inherit' | 'tone.soft' | 'tone.dim' | 'tone.bright'

const CORNER_RADIUS_OPTIONS: readonly { id: string; label: RefineLabel }[] = [
  { id: 'inherit', label: 'radius.inherit' },
  { id: 'sm', label: 'radius.sm' },
  { id: 'md', label: 'radius.md' },
  { id: 'lg', label: 'radius.lg' },
  { id: 'xl', label: 'radius.xl' },
]

const SHADOW_OPTIONS: readonly { id: string; label: RefineLabel }[] = [
  { id: 'inherit', label: 'shadow.inherit' },
  { id: 'none', label: 'shadow.none' },
  { id: 'soft', label: 'shadow.soft' },
  { id: 'medium', label: 'shadow.medium' },
  { id: 'strong', label: 'shadow.strong' },
]

const TONE_OPTIONS: readonly { id: string; label: RefineLabel }[] = [
  { id: 'inherit', label: 'tone.inherit' },
  { id: 'soft', label: 'tone.soft' },
  { id: 'dim', label: 'tone.dim' },
  { id: 'bright', label: 'tone.bright' },
]

/** Mini color preview for a preset (accent-graded wash; gradient when shipped). */
const presetPreviewBackground = (config: Partial<CustomThemeConfig>): string => {
  const accent = typeof config.accent === 'string' && config.accent !== ''
    ? config.accent
    : '#4176e6'
  if (typeof config.gradient === 'string' && config.gradient !== '') {
    return config.gradient
  }
  return `linear-gradient(135deg, ${accent}, ${accent}55)`
}

/** One parameter-group card with a "恢复本组默认" action. */
function GroupCard({
  title, resetLabel, group, writable, onReset, children,
}: {
  title: string
  resetLabel: string
  group: ParamGroup
  writable: boolean
  onReset: (group: ParamGroup) => void
  children: ReactNode
}) {
  return (
    <div className={css.card}>
      <div className={css.groupHeader}>
        <h3 className={css.cardTitle}>{title}</h3>
        <button
          type="button"
          className={css.groupReset}
          disabled={!writable}
          onClick={() => onReset(group)}
        >
          {resetLabel}
        </button>
      </div>
      {children}
    </div>
  )
}

/**
 * Render the appearance section content.
 * @param props - composed slot props + injected controller face.
 * @returns the section element tree.
 */
export function AppearanceSection({
  t, useAppearance, setField, applyFontPreset, randomInspiration, resetGroup, preview, applyPreset, saveMyPreset, removeMyPreset, applyMyPreset,
  cancelPreview, save, resetAll, renderSlot, close,
}: AppearanceSectionProps) {
  const state = useAppearance((value) => value)
  const translator = t as TranslateNS<'appearance'>
  const draft = state.draft
  const [presetName, setPresetName] = useState('')
  const num = (field: ThemeField, fallback: number): number =>
    typeof draft[field] === 'number' ? draft[field] as number : fallback
  const str = (field: ThemeField, fallback: string): string =>
    typeof draft[field] === 'string' ? draft[field] as string : fallback
  const bool = (field: ThemeField, fallback: boolean): boolean =>
    typeof draft[field] === 'boolean' ? draft[field] as boolean : fallback

  // One-click harmony swatches derived from the current accent (Material-You
  // style); picking one stages the accent without saving.
  const accent = str('accent', '#4176e6')
  const swatches = useMemo(() => harmonySwatches(accent), [accent])

  // A preset click stages its config into the form — the wallpaper clears and
  // the fields fill in, but nothing is applied yet. The user then previews
  // through the shared 预览 button, exactly like any manual edit (one unified
  // preview path); save persists it, cancelPreview reverts.
  const handlePreset = (id: string): void => {
    applyPreset(id)
  }
  const handleMyPreset = (id: string): void => {
    applyMyPreset(id)
  }
  const handleSaveMyPreset = (): void => {
    saveMyPreset(presetName)
    setPresetName('')
  }

  // The preview button applies the staged draft to the document and closes the
  // settings dialog: the user is dropped into a full-app preview with a
  // floating bar (F2 returns to settings; Apply persists, Cancel reverts).
  const handlePreview = (): void => {
    preview()
    close()
  }

  // Which font pairing the staged stacks currently match ('' = none).
  const fontPresetId = FONT_PRESETS.find(
    (preset) => preset.uiFont === str('fontFamily', '') && preset.codeFont === str('codeFontFamily', ''),
  )?.id ?? '__custom__'

  if (state.status === 'unavailable') {
    return (
      <div className={css.section} data-dsu-motion="fade-up">
        <h2 className={css.heading}>{translator('title')}</h2>
        <p className={css.intro}>{translator('unavailable')}</p>
        <p className={css.hint}>{translator('unavailableHint')}</p>
      </div>
    )
  }

  return (
    <div className={css.section} data-dsu-motion="fade-up">
      <h2 className={css.heading}>{translator('title')}</h2>
      <p className={css.intro}>{translator('intro')}</p>

      {/* Merged theme preference row (ui-theme renders into this child slot). */}
      <div className={css.preference}>{renderSlot('settings.appearance.item', {})}</div>

      {/* Live preview: a mini UI that follows every parameter below. */}
      <div className={css.card}>
        <div className={css.groupHeader}>
          <h3 className={css.cardTitle}>{translator('previewTitle')}</h3>
          <button
            type="button"
            className={css.inspire}
            disabled={!state.writable}
            onClick={randomInspiration}
          >
            {translator('randomInspiration')}
          </button>
        </div>
        <AppearancePreview draft={draft} />
        <p className={css.hint}>{translator('previewHint')}</p>
      </div>

      {/* Preset gallery: click to stage the preset into the form below. */}
      <div className={css.card}>
        <h3 className={css.cardTitle}>{translator('presetTitle')}</h3>
        <p className={css.hint}>{translator('presetHint')}</p>
        <div className={css.presetGrid}>
          {PRESETS.map((preset) => {
            const active = state.activePreset?.kind === 'shipped' && state.activePreset.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                className={`${css.presetCard}${active ? ` ${css.presetCardActive}` : ''}`}
                disabled={!state.writable}
                onClick={() => handlePreset(preset.id)}
              >
                <span className={css.presetPreview} style={{ background: presetPreviewBackground(preset.config) }} />
                <span className={css.presetName}>{preset.name}</span>
                {active ? <span className={css.presetBadge}>{translator('activePreset')}</span> : null}
                <span className={css.presetDesc}>{preset.description}</span>
              </button>
            )
          })}
        </div>

        {/* 我的预设: save the current draft as a personal preset; saved presets
            join the gallery with a remove action. */}
        <div className={css.presetSaveRow}>
          <input
            className={css.presetNameInput}
            type="text"
            value={presetName}
            placeholder={translator('myPresetName')}
            disabled={!state.writable}
            onChange={(event) => setPresetName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') handleSaveMyPreset() }}
          />
          <button
            type="button"
            className={css.presetSave}
            disabled={!state.writable || presetName.trim() === ''}
            onClick={handleSaveMyPreset}
          >
            {translator('saveMyPreset')}
          </button>
        </div>
        {state.myPresets.length > 0 && (
          <div className={css.presetGrid}>
            {state.myPresets.map((preset) => {
              const active = state.activePreset?.kind === 'my' && state.activePreset.id === preset.id
              return (
                <div
                  key={preset.id}
                  className={`${css.presetCard}${active ? ` ${css.presetCardActive}` : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMyPreset(preset.id)}
                >
                  <span className={css.presetPreview} style={{ background: presetPreviewBackground(preset.config) }} />
                  <span className={css.presetName}>{preset.name}</span>
                  {active ? <span className={css.presetBadge}>{translator('activePreset')}</span> : null}
                  <button
                    type="button"
                    className={css.presetRemove}
                    aria-label={translator('removeMyPreset')}
                    onClick={(event) => { event.stopPropagation(); removeMyPreset(preset.id) }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 背景: wallpaper + glass + gradient + scrim + tone. */}
      <GroupCard title={translator('groupBackground')} resetLabel={translator('groupReset')} group="background" writable={state.writable} onReset={resetGroup}>
        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-wallpaper">{translator('wallpaper')}</label>
          <input
            id="appearance-wallpaper"
            className={css.text}
            type="text"
            value={str('wallpaper', '')}
            disabled={!state.writable}
            onChange={(event) => setField('wallpaper', event.target.value)}
          />
          <p className={css.hint}>{translator('wallpaperHint')}</p>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-glass">{translator('glass')}</label>
          <select
            id="appearance-glass"
            className={css.select}
            value={str('glass', 'frosted')}
            disabled={!state.writable}
            onChange={(event) => setField('glass', event.target.value)}
          >
            {GLASS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{translator(option.label)}</option>
            ))}
          </select>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-gradient">{translator('gradient')}</label>
          <input
            id="appearance-gradient"
            className={css.text}
            type="text"
            value={str('gradient', '')}
            disabled={!state.writable}
            onChange={(event) => setField('gradient', event.target.value)}
          />
          <p className={css.hint}>{translator('gradientHint')}</p>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-darkScrim">{translator('darkScrim')}</label>
          <span className={css.slider}>
            <input
              id="appearance-darkScrim"
              className={css.range}
              type="range"
              min={0}
              max={100}
              value={num('darkScrim', 0)}
              style={{ ['--fill' as string]: `${num('darkScrim', 0)}%` }}
              disabled={!state.writable}
              onChange={(event) => setField('darkScrim', Number(event.target.value))}
            />
            <span className={css.rangeValue}>{num('darkScrim', 0)}%</span>
          </span>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-wallpaperTone">{translator('wallpaperTone')}</label>
          <select
            id="appearance-wallpaperTone"
            className={css.select}
            value={str('wallpaperTone', 'inherit')}
            disabled={!state.writable}
            onChange={(event) => setField('wallpaperTone', event.target.value)}
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{translator(option.label)}</option>
            ))}
          </select>
        </div>
      </GroupCard>

      {/* 色彩: accent + palette + autoAccent + dark accent. */}
      <GroupCard title={translator('groupColor')} resetLabel={translator('groupReset')} group="color" writable={state.writable} onReset={resetGroup}>
        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-accent">{translator('accent')}</label>
          <span className={css.slider}>
            <input
              id="appearance-accent"
              className={css.color}
              type="color"
              value={accent}
              disabled={!state.writable}
              onChange={(event) => setField('accent', event.target.value)}
            />
            <input
              className={css.text}
              type="text"
              value={accent}
              disabled={!state.writable}
              onChange={(event) => setField('accent', event.target.value)}
            />
          </span>
        </div>

        <div className={css.row}>
          <label className={css.label}>{translator('accentPalette')}</label>
          <span className={css.swatches}>
            {swatches.map((color) => (
              <button
                key={color}
                type="button"
                className={css.swatch}
                style={{ background: color }}
                title={color}
                aria-label={color}
                disabled={!state.writable}
                onClick={() => setField('accent', color)}
              />
            ))}
          </span>
          <p className={css.hint}>{translator('accentPaletteHint')}</p>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-autoAccent">{translator('autoAccent')}</label>
          <span className={css.check}>
            <input
              id="appearance-autoAccent"
              className={css.checkbox}
              type="checkbox"
              checked={bool('autoAccent', false)}
              disabled={!state.writable}
              onChange={(event) => setField('autoAccent', event.target.checked)}
            />
          </span>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-darkAccent">{translator('darkAccent')}</label>
          <span className={css.slider}>
            <input
              id="appearance-darkAccent"
              className={css.color}
              type="color"
              value={str('darkAccent', '') || '#4176e6'}
              disabled={!state.writable}
              onChange={(event) => setField('darkAccent', event.target.value)}
            />
            <input
              className={css.text}
              type="text"
              value={str('darkAccent', '')}
              placeholder={translator('darkAccentPlaceholder')}
              disabled={!state.writable}
              onChange={(event) => setField('darkAccent', event.target.value)}
            />
          </span>
          <p className={css.hint}>{translator('darkAccentHint')}</p>
        </div>
      </GroupCard>

      {/* 表面: the six opacity sliders. */}
      <GroupCard title={translator('groupSurface')} resetLabel={translator('groupReset')} group="surface" writable={state.writable} onReset={resetGroup}>
        {SLIDERS.map((slider) => (
          <div key={slider.field} className={css.row}>
            <label className={css.label} htmlFor={`appearance-${slider.field}`}>{translator(slider.label)}</label>
            <span className={css.slider}>
              <input
                id={`appearance-${slider.field}`}
                className={css.range}
                type="range"
                min={0}
                max={100}
                value={num(slider.field, 100)}
                style={{ ['--fill' as string]: `${num(slider.field, 100)}%` }}
                disabled={!state.writable}
                onChange={(event) => setField(slider.field, Number(event.target.value))}
              />
              <span className={css.rangeValue}>{num(slider.field, 100)}%</span>
            </span>
          </div>
        ))}
      </GroupCard>

      {/* 排版: font pairing presets + ui/code stacks + whole-UI font scale. */}
      <GroupCard title={translator('groupTypography')} resetLabel={translator('groupReset')} group="typography" writable={state.writable} onReset={resetGroup}>
        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-fontPreset">{translator('fontPreset')}</label>
          <select
            id="appearance-fontPreset"
            className={css.select}
            value={fontPresetId}
            disabled={!state.writable}
            onChange={(event) => { if (event.target.value !== '__custom__') applyFontPreset(event.target.value) }}
          >
            {FONT_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
            <option value="__custom__">{translator('fontCustom')}</option>
          </select>
          <p className={css.hint}>{translator('fontPresetHint')}</p>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-font">{translator('fontFamily')}</label>
          <input
            id="appearance-font"
            className={css.text}
            type="text"
            value={str('fontFamily', '')}
            disabled={!state.writable}
            onChange={(event) => setField('fontFamily', event.target.value)}
          />
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-codeFont">{translator('codeFontFamily')}</label>
          <input
            id="appearance-codeFont"
            className={css.text}
            type="text"
            value={str('codeFontFamily', '')}
            disabled={!state.writable}
            onChange={(event) => setField('codeFontFamily', event.target.value)}
          />
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-fontScale">{translator('fontScale')}</label>
          <span className={css.slider}>
            <input
              id="appearance-fontScale"
              className={css.range}
              type="range"
              min={0.9}
              max={1.1}
              step={0.05}
              value={num('fontScale', 1)}
              style={{ ['--fill' as string]: `${((num('fontScale', 1) - 0.9) / 0.2) * 100}%` }}
              disabled={!state.writable}
              onChange={(event) => setField('fontScale', Number(event.target.value))}
            />
            <span className={css.rangeValue}>×{num('fontScale', 1).toFixed(2)}</span>
          </span>
          <p className={css.hint}>{translator('fontScaleHint')}</p>
        </div>
      </GroupCard>

      {/* 质感: the opt-in refinement knobs. */}
      <GroupCard title={translator('refineTitle')} resetLabel={translator('groupReset')} group="refine" writable={state.writable} onReset={resetGroup}>
        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-cornerRadius">{translator('cornerRadius')}</label>
          <select
            id="appearance-cornerRadius"
            className={css.select}
            value={str('cornerRadius', 'inherit')}
            disabled={!state.writable}
            onChange={(event) => setField('cornerRadius', event.target.value)}
          >
            {CORNER_RADIUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{translator(option.label)}</option>
            ))}
          </select>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-surfaceShadow">{translator('surfaceShadow')}</label>
          <select
            id="appearance-surfaceShadow"
            className={css.select}
            value={str('surfaceShadow', 'inherit')}
            disabled={!state.writable}
            onChange={(event) => setField('surfaceShadow', event.target.value)}
          >
            {SHADOW_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{translator(option.label)}</option>
            ))}
          </select>
        </div>

        <div className={css.row}>
          <label className={css.label} htmlFor="appearance-focusGlow">{translator('focusGlow')}</label>
          <span className={css.check}>
            <input
              id="appearance-focusGlow"
              className={css.checkbox}
              type="checkbox"
              checked={str('focusGlow', 'inherit') === 'on'}
              disabled={!state.writable}
              onChange={(event) => setField('focusGlow', event.target.checked ? 'on' : 'inherit')}
            />
          </span>
        </div>

        {(['scrollbarAccent', 'vignette'] as const).map((field) => (
          <div key={field} className={css.row}>
            <label className={css.label} htmlFor={`appearance-${field}`}>{translator(field)}</label>
            <span className={css.check}>
              <input
                id={`appearance-${field}`}
                className={css.checkbox}
                type="checkbox"
                checked={bool(field, false)}
                disabled={!state.writable}
                onChange={(event) => setField(field, event.target.checked)}
              />
            </span>
          </div>
        ))}
      </GroupCard>

      <div className={css.footer}>
        {state.dirty ? <span className={css.dirty}>{translator('dirty')}</span> : null}
        {state.previewing ? <span className={css.previewing}>{translator('previewing')}</span> : null}
        <button
          type="button"
          className={css.reset}
          disabled={!state.writable || state.saving}
          onClick={resetAll}
        >
          {translator('reset')}
        </button>
        {state.previewing ? (
          <button
            type="button"
            className={css.cancel}
            disabled={!state.writable || state.saving}
            onClick={cancelPreview}
          >
            {translator('cancelPreview')}
          </button>
        ) : (
          <button
            type="button"
            className={css.preview}
            disabled={!state.dirty || !state.writable || state.saving}
            onClick={handlePreview}
          >
            {translator('preview')}
          </button>
        )}
        <button
          type="button"
          className={css.save}
          disabled={!state.dirty || !state.writable || state.saving}
          onClick={save}
        >
          {state.saving ? translator('saving') : translator('save')}
        </button>
      </div>
    </div>
  )
}
