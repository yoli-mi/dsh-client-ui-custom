/**
 * The "动效" settings section: the conversation entrance-motion toggle plus
 * the entrance-style selector. Reads/writes the ui-custom settings scope's
 * `motionEnabled` / `motionStyle`; the motion engine (motion.ts) gates on
 * these.
 */

import { useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  DEFAULT_MOTION_STYLE, DEFAULT_NEW_CHAT_MOTION_STYLE, DEFAULT_SIDEBAR_MOTION_STYLE,
  MOTION_PRESETS, isMotionStyle, isNewChatMotionStyle, isSidebarMotionStyle,
  type MotionPresetConfig, type MotionPresetId,
  type MotionStyle, type NewChatMotionStyle, type SidebarMotionStyle, type UiCustomSection,
} from '../../shared.ts'
import type { MotionKey } from './motion-locales.ts'
import css from './MotionSection.module.css'

/** Registration-side preference face. */
export interface MotionSectionInjected {
  hooks: {
    /** The ui-custom settings scope, read for motionEnabled / motionStyle. */
    motion: SettingsScope<UiCustomSection>
  }
  /** Toggle the conversation entrance motion. */
  setMotionEnabled: (enabled: boolean) => void
  /** Change the entrance style fresh messages use. */
  setMotionStyle: (style: MotionStyle) => void
  /** Toggle the sidebar motion (tree entrance + group expand). */
  setSidebarMotionEnabled: (enabled: boolean) => void
  /** Change the entrance style fresh sidebar tree items use. */
  setSidebarMotionStyle: (style: SidebarMotionStyle) => void
  /** Toggle the persistent selection-box trace. */
  setSelectionMotionEnabled: (enabled: boolean) => void
  /** Toggle the new-conversation (blank-session) entrance. */
  setNewChatMotionEnabled: (enabled: boolean) => void
  /** Change the entrance style the new-conversation dialog uses. */
  setNewChatMotionStyle: (style: NewChatMotionStyle) => void
  /** Toggle the settings-shell motion (dialog expansion, nav highlight, page switch). */
  setSettingsMotionEnabled: (enabled: boolean) => void
  /** Apply one curated motion preset (every toggle + every style at once). */
  applyMotionPreset: (preset: MotionPresetId) => void
}

/** Full Settings-section props. */
export type MotionSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'motion'>
  & InjectFace<MotionSectionInjected>

/** The selectable transcript styles, in display order (the default is the first). */
const STYLE_OPTIONS: readonly { id: MotionStyle; label: MotionKey }[] = [
  { id: 'fade-up', label: 'styleFadeUp' },
  { id: 'fade', label: 'styleFade' },
  { id: 'rise-scale', label: 'styleRiseScale' },
  { id: 'slide-in', label: 'styleSlideIn' },
  { id: 'blur-in', label: 'styleBlurIn' },
  { id: 'scale-in', label: 'styleScaleIn' },
]

/** The selectable sidebar styles, in display order (the default is the first). */
const SIDEBAR_OPTIONS: readonly { id: SidebarMotionStyle; label: MotionKey }[] = [
  { id: 'slide-left', label: 'styleSlideLeft' },
  { id: 'fade', label: 'styleFade' },
  { id: 'expand', label: 'styleExpand' },
  { id: 'slide-down', label: 'styleSlideDown' },
]

/** The selectable new-conversation styles (large-surface, gentle set). */
const NEW_CHAT_OPTIONS: readonly { id: NewChatMotionStyle; label: MotionKey }[] = [
  { id: 'reveal', label: 'styleReveal' },
  { id: 'fade', label: 'styleFade' },
  { id: 'bloom', label: 'styleBloom' },
  { id: 'zoom', label: 'styleZoom' },
]

/** Preset label + description locale keys, keyed by preset id (see MOTION_PRESETS). */
const PRESET_META: Record<MotionPresetId, { label: MotionKey; desc: MotionKey }> = {
  fluid: { label: 'presetFluid', desc: 'presetFluidDesc' },
  elegant: { label: 'presetElegant', desc: 'presetElegantDesc' },
  minimal: { label: 'presetMinimal', desc: 'presetMinimalDesc' },
}

/** Whether a config bundle matches the section's current motion values. */
function matchesPreset(section: UiCustomSection | undefined, config: MotionPresetConfig): boolean {
  return (section?.motionEnabled ?? true) === config.motionEnabled
    && (section?.motionStyle ?? DEFAULT_MOTION_STYLE) === config.motionStyle
    && (section?.sidebarMotionEnabled ?? true) === config.sidebarMotionEnabled
    && (section?.sidebarMotionStyle ?? DEFAULT_SIDEBAR_MOTION_STYLE) === config.sidebarMotionStyle
    && (section?.selectionMotionEnabled ?? true) === config.selectionMotionEnabled
    && (section?.newChatMotionEnabled ?? true) === config.newChatMotionEnabled
    && (section?.newChatMotionStyle ?? DEFAULT_NEW_CHAT_MOTION_STYLE) === config.newChatMotionStyle
    && (section?.settingsMotionEnabled ?? true) === config.settingsMotionEnabled
}

/**
 * Render the motion settings section content.
 * @param props - composed Settings slot props.
 */
export function MotionSection({
  useMotion, setMotionEnabled, setMotionStyle,
  setSidebarMotionEnabled, setSidebarMotionStyle,
  setSelectionMotionEnabled, setNewChatMotionEnabled, setNewChatMotionStyle, setSettingsMotionEnabled,
  applyMotionPreset, t,
}: MotionSectionProps) {
  const scope = useMotion((value) => value)
  const enabled = scope?.value?.motionEnabled ?? true
  const sidebarEnabled = scope?.value?.sidebarMotionEnabled ?? true
  const selectionEnabled = scope?.value?.selectionMotionEnabled ?? true
  const newChatEnabled = scope?.value?.newChatMotionEnabled ?? true
  const settingsEnabled = scope?.value?.settingsMotionEnabled ?? true
  const newChatStyle = isNewChatMotionStyle(scope?.value?.newChatMotionStyle)
    ? scope.value.newChatMotionStyle
    : DEFAULT_NEW_CHAT_MOTION_STYLE
  const style = isMotionStyle(scope?.value?.motionStyle) ? scope.value.motionStyle : DEFAULT_MOTION_STYLE
  const sidebarStyle = isSidebarMotionStyle(scope?.value?.sidebarMotionStyle)
    ? scope.value.sidebarMotionStyle
    : DEFAULT_SIDEBAR_MOTION_STYLE
  const [open, setOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const translator = t as TranslateNS<'motion'>
  const selectedLabel = (STYLE_OPTIONS.find(option => option.id === style) ?? STYLE_OPTIONS[0]!).label
  const sidebarSelectedLabel = (SIDEBAR_OPTIONS.find(option => option.id === sidebarStyle) ?? SIDEBAR_OPTIONS[0]!).label
  const newChatSelectedLabel = (NEW_CHAT_OPTIONS.find(option => option.id === newChatStyle) ?? NEW_CHAT_OPTIONS[0]!).label
  return (
    <div className={css.section}>
      <h2 className={css.heading}>{translator('title')}</h2>
      <p className={css.intro}>{translator('intro')}</p>
      <div className={`${css.row} ${css.rowDivider}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('presetTitle')}</div>
          <div className={css.desc}>{translator('presetDesc')}</div>
        </div>
        <div className={css.presets} role="group" aria-label={translator('presetTitle')}>
          {MOTION_PRESETS.map((preset) => {
            const meta = PRESET_META[preset.id]
            if (meta === undefined) return null
            return (
              <button
                key={preset.id}
                type="button"
                className={`${css.preset} ${matchesPreset(scope?.value, preset.config) ? css.presetActive : ''}`}
                aria-pressed={matchesPreset(scope?.value, preset.config)}
                title={translator(meta.desc)}
                onClick={() => applyMotionPreset(preset.id)}
              >
                {translator(meta.label)}
              </button>
            )
          })}
        </div>
      </div>
      <div className={`${css.row} ${css.rowDivider} ${enabled ? '' : css.rowDisabled}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('toggleTitle')}</div>
          <div className={css.desc}>{translator('toggleDesc')}</div>
        </div>
        <label className={css.switch}>
          <input
            type="checkbox"
            className={css.checkbox}
            aria-label={translator('toggleTitle')}
            checked={enabled}
            onChange={(event) => setMotionEnabled(event.target.checked)}
          />
        </label>
      </div>
      <div className={`${css.row} ${enabled ? '' : css.rowDisabled}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('styleTitle')}</div>
          <div className={css.desc}>{translator('styleDesc')}</div>
        </div>
        <Menu
          open={open}
          onClose={() => { setOpen(false) }}
          items={STYLE_OPTIONS.map(option => ({ id: option.id, label: translator(option.label) }))}
          selectedId={style}
          onSelect={(id) => {
            setOpen(false)
            // Guard the Menu's free-form id before it lands in the settings doc.
            if (isMotionStyle(id)) setMotionStyle(id)
          }}
          align="end"
          portal
          anchor={(
            <button
              type="button"
              className={css.selector}
              disabled={!enabled}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => { setOpen(value => !value) }}
            >
              {translator(selectedLabel)}
              <IconChevronDownOutline14 className={css.chevron} />
            </button>
          )}
        />
      </div>
      <div className={`${css.row} ${css.rowDivider}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('sidebarToggleTitle')}</div>
          <div className={css.desc}>{translator('sidebarToggleDesc')}</div>
        </div>
        <label className={css.switch}>
          <input
            type="checkbox"
            className={css.checkbox}
            aria-label={translator('sidebarToggleTitle')}
            checked={sidebarEnabled}
            onChange={(event) => setSidebarMotionEnabled(event.target.checked)}
          />
        </label>
      </div>
      <div className={`${css.row} ${sidebarEnabled ? '' : css.rowDisabled}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('sidebarStyleTitle')}</div>
          <div className={css.desc}>{translator('sidebarStyleDesc')}</div>
        </div>
        <Menu
          open={sidebarOpen}
          onClose={() => { setSidebarOpen(false) }}
          items={SIDEBAR_OPTIONS.map(option => ({ id: option.id, label: translator(option.label) }))}
          selectedId={sidebarStyle}
          onSelect={(id) => {
            setSidebarOpen(false)
            // Guard the Menu's free-form id before it lands in the settings doc.
            if (isSidebarMotionStyle(id)) setSidebarMotionStyle(id)
          }}
          align="end"
          portal
          anchor={(
            <button
              type="button"
              className={css.selector}
              disabled={!sidebarEnabled}
              aria-haspopup="menu"
              aria-expanded={sidebarOpen}
              onClick={() => { setSidebarOpen(value => !value) }}
            >
              {translator(sidebarSelectedLabel)}
              <IconChevronDownOutline14 className={css.chevron} />
            </button>
          )}
        />
      </div>
      <div className={`${css.row} ${css.rowDivider}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('selectionToggleTitle')}</div>
          <div className={css.desc}>{translator('selectionToggleDesc')}</div>
        </div>
        <label className={css.switch}>
          <input
            type="checkbox"
            className={css.checkbox}
            aria-label={translator('selectionToggleTitle')}
            checked={selectionEnabled}
            onChange={(event) => setSelectionMotionEnabled(event.target.checked)}
          />
        </label>
      </div>
      <div className={`${css.row} ${css.rowDivider}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('newChatToggleTitle')}</div>
          <div className={css.desc}>{translator('newChatToggleDesc')}</div>
        </div>
        <label className={css.switch}>
          <input
            type="checkbox"
            className={css.checkbox}
            aria-label={translator('newChatToggleTitle')}
            checked={newChatEnabled}
            onChange={(event) => setNewChatMotionEnabled(event.target.checked)}
          />
        </label>
      </div>
      <div className={`${css.row} ${newChatEnabled ? '' : css.rowDisabled}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('newChatStyleTitle')}</div>
          <div className={css.desc}>{translator('newChatStyleDesc')}</div>
        </div>
        <Menu
          open={newChatOpen}
          onClose={() => { setNewChatOpen(false) }}
          items={NEW_CHAT_OPTIONS.map(option => ({ id: option.id, label: translator(option.label) }))}
          selectedId={newChatStyle}
          onSelect={(id) => {
            setNewChatOpen(false)
            // Guard the Menu's free-form id before it lands in the settings doc.
            if (isNewChatMotionStyle(id)) setNewChatMotionStyle(id)
          }}
          align="end"
          portal
          anchor={(
            <button
              type="button"
              className={css.selector}
              disabled={!newChatEnabled}
              aria-haspopup="menu"
              aria-expanded={newChatOpen}
              onClick={() => { setNewChatOpen(value => !value) }}
            >
              {translator(newChatSelectedLabel)}
              <IconChevronDownOutline14 className={css.chevron} />
            </button>
          )}
        />
      </div>
      <div className={`${css.row} ${css.rowDivider}`}>
        <div className={css.rowText}>
          <div className={css.title}>{translator('settingsToggleTitle')}</div>
          <div className={css.desc}>{translator('settingsToggleDesc')}</div>
        </div>
        <label className={css.switch}>
          <input
            type="checkbox"
            className={css.checkbox}
            aria-label={translator('settingsToggleTitle')}
            checked={settingsEnabled}
            onChange={(event) => setSettingsMotionEnabled(event.target.checked)}
          />
        </label>
      </div>
    </div>
  )
}
