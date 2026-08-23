/**
 * The "动效" settings section: master switch, motion style tier, and a preset
 * bundle picker. Reads/writes the ui-custom settings namespace's
 * animationEnabled / animationStyle / animationPreset; the client applies
 * them to `html[data-dsu-anim]` + `--dsu-anim-*` variables reactively.
 */

import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { AnimationPreset, AnimationStyle, UiCustomSection } from '../../shared.ts'
import type { AnimationKey } from './animation-locales.ts'
import css from './AnimationSection.module.css'

/** Registration-side face: the ui-custom scope behind the motion knobs. */
export interface AnimationInjected {
  hooks: {
    /** The ui-custom settings scope, read for animationEnabled/Style/Preset. */
    animation: SettingsScope<UiCustomSection>
  }
  setEnabled(enabled: boolean): void
  setStyle(style: AnimationStyle): void
  setPreset(preset: AnimationPreset): void
}

/** Full Settings-section props. */
export type AnimationSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'animation'>
  & InjectFace<AnimationInjected>

/** Style options in display order. */
const STYLES: readonly { id: AnimationStyle; label: AnimationKey; desc: AnimationKey }[] = [
  { id: 'soft', label: 'style.soft', desc: 'style.softDesc' },
  { id: 'standard', label: 'style.standard', desc: 'style.standardDesc' },
  { id: 'lively', label: 'style.lively', desc: 'style.livelyDesc' },
]

/** Preset options in display order. */
const PRESETS: readonly { id: AnimationPreset; label: AnimationKey; desc: AnimationKey }[] = [
  { id: 'balanced', label: 'preset.balanced', desc: 'preset.balancedDesc' },
  { id: 'focus', label: 'preset.focus', desc: 'preset.focusDesc' },
]

/**
 * Render the motion section content.
 * @param props - composed slot props + injected controller face.
 */
export function AnimationSection({
  t, useAnimation, setEnabled, setStyle, setPreset,
}: AnimationSectionProps) {
  const scope = useAnimation((value) => value)
  const value = scope?.value
  const translator = t as TranslateNS<'animation'>
  const enabled = value?.animationEnabled ?? true
  const style = value?.animationStyle ?? 'standard'
  const preset = value?.animationPreset ?? 'balanced'
  return (
    <div className={css.section} data-dsu-motion="fade-up">
      <h2 className={css.heading}>{translator('title')}</h2>
      <p className={css.intro}>{translator('intro')}</p>

      <div className={css.switchRow}>
        <div className={css.rowText}>
          <div className={css.rowTitle}>{translator('enabled')}</div>
          <p className={css.rowDesc}>{translator('enabledDesc')}</p>
        </div>
        <label className={css.switch}>
          <input
            type="checkbox"
            className={css.checkbox}
            aria-label={translator('enabled')}
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </label>
      </div>

      <div className={css.row}>
        <div className={css.rowTitle}>{translator('style')}</div>
        <p className={css.rowDesc}>{translator('styleDesc')}</p>
        <div className={css.options}>
          {STYLES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${css.option}${style === option.id ? ` ${css.optionActive}` : ''}`}
              aria-pressed={style === option.id}
              onClick={() => setStyle(option.id)}
            >
              <span className={css.optionLabel}>
                <span className={css.optionName}>{translator(option.label)}</span>
                <span className={css.optionDesc}>{translator(option.desc)}</span>
              </span>
              {style === option.id ? <span className={css.check}>✓</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className={css.row}>
        <div className={css.rowTitle}>{translator('preset')}</div>
        <p className={css.rowDesc}>{translator('presetDesc')}</p>
        <div className={css.options}>
          {PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${css.option}${preset === option.id ? ` ${css.optionActive}` : ''}`}
              aria-pressed={preset === option.id}
              onClick={() => setPreset(option.id)}
            >
              <span className={css.optionLabel}>
                <span className={css.optionName}>{translator(option.label)}</span>
                <span className={css.optionDesc}>{translator(option.desc)}</span>
              </span>
              {preset === option.id ? <span className={css.check}>✓</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
