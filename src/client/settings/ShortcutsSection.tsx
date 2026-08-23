/** The "快捷键" settings section: six recordable bindings, the default
 * workspace for the new-conversation shortcut, one-to-one model shortcuts,
 * and the save/reset footer. */

import { useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ShortcutAction } from '../shortcuts.ts'
import type { ShortcutsKey } from '../locales.ts'
import type { ShortcutsSettingsInjected } from './contract.ts'
import { KeyCapture } from './KeyCapture.tsx'
import css from './ShortcutsSection.module.css'

/** Props the renderer binds for the section. */
export type ShortcutsSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'shortcuts'>
  & InjectFace<ShortcutsSettingsInjected>

/** The rows, in display order. */
const ROWS: readonly { field: ShortcutAction; label: ShortcutsKey }[] = [
  { field: 'newConversation', label: 'newConversation' },
  { field: 'switchModel', label: 'switchModel' },
  { field: 'cycleThinking', label: 'cycleThinking' },
  { field: 'sendMessage', label: 'sendMessage' },
  { field: 'newline', label: 'newline' },
  { field: 'usagePanel', label: 'usagePanel' },
]

/**
 * Render the shortcuts section content.
 * @param props - composed slot props + injected controller face.
 */
export function ShortcutsSection({
  t, useShortcuts, useWorkspaces, useModels, setDraft, save, resetField,
  setDefaultWorkspace, addModelShortcut, removeModelShortcut,
  setModelShortcutCombo, setModelShortcutTarget, usageAvailable,
}: ShortcutsSectionProps) {
  const state = useShortcuts((value) => value)
  const workspaces = useWorkspaces((value) => value)
  const models = useModels((value) => value)
  const [wsOpen, setWsOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState<number | null>(null)
  const items = workspaces?.items ?? []
  // Cross-feature gate: the usage-panel binding only makes sense (and only
  // dispatches) when the usage feature is mounted too.
  const rows = ROWS.filter((row) => row.field !== 'usagePanel' || usageAvailable)

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{t('title')}</h2>
      <p className={css.intro}>{t('intro')}</p>
      {state.status === 'unavailable' ? (
        <div className={css.unavailable}>
          <p>{t('unavailable')}</p>
          <p className={css.unavailableHint}>{t('unavailableHint')}</p>
        </div>
      ) : (
        <div className={css.rows}>
          {rows.map((row) => (
            <div key={row.field} className={css.row}>
              <label className={css.label} htmlFor={`shortcut-${row.field}`}>{t(row.label)}</label>
              <KeyCapture
                id={`shortcut-${row.field}`}
                value={state.draft[row.field]}
                onChange={(spec) => setDraft(row.field, spec)}
                t={t}
                disabled={!state.writable}
              />
              <button
                type="button"
                className={css.reset}
                disabled={!state.writable}
                onClick={() => resetField(row.field)}
              >
                {t('reset')}
              </button>
            </div>
          ))}

          {/* Default workspace: where the new-conversation shortcut opens. */}
          <div className={css.row}>
            <label className={css.label} htmlFor="default-workspace">{t('defaultWorkspaceTitle')}</label>
            <Menu
              open={wsOpen}
              onClose={() => { setWsOpen(false) }}
              items={[
                { id: '', label: t('defaultWorkspaceNone') },
                ...items.map(workspace => ({ id: workspace.workspaceId, label: workspace.title })),
              ]}
              selectedId={state.draft.defaultWorkspace}
              onSelect={(id) => {
                setWsOpen(false)
                setDefaultWorkspace(id)
              }}
              align="end"
              portal
              anchor={(
                <button
                  type="button"
                  id="default-workspace"
                  className={css.selector}
                  aria-haspopup="menu"
                  aria-expanded={wsOpen}
                  disabled={!state.writable}
                  onClick={() => { setWsOpen(value => !value) }}
                >
                  {state.draft.defaultWorkspace === ''
                    ? t('defaultWorkspaceNone')
                    : (items.find(workspace => workspace.workspaceId === state.draft.defaultWorkspace)?.title ?? state.draft.defaultWorkspace)}
                  <IconChevronDownOutline14 className={css.chevron} />
                </button>
              )}
            />
          </div>
          <p className={css.rowDesc}>{t('defaultWorkspaceDesc')}</p>

          {/* One-to-one model shortcuts: combo → a specific model. */}
          <div className={css.modelBlock}>
            <div className={css.modelTitle}>{t('modelShortcutTitle')}</div>
            <p className={css.modelDesc}>{t('modelShortcutDesc')}</p>
            {state.draft.modelShortcuts.length === 0 ? (
              <p className={css.modelEmpty}>{t('modelShortcutEmpty')}</p>
            ) : (
              <div className={css.modelList}>
                {state.draft.modelShortcuts.map((entry, index) => {
                  const target = models.options.find(option =>
                    option.provider === entry.provider && option.model === entry.model)
                  return (
                    <div className={css.modelRow} key={index}>
                      <KeyCapture
                        id={`model-shortcut-${index}`}
                        value={entry.combo}
                        onChange={(spec) => setModelShortcutCombo(index, spec)}
                        t={t}
                        disabled={!state.writable}
                      />
                      <Menu
                        open={modelOpen === index}
                        onClose={() => { setModelOpen(null) }}
                        items={models.options.map(option => ({
                          id: `${option.provider}:${option.model}`,
                          label: option.label,
                        }))}
                        selectedId={entry.provider === '' || entry.model === '' ? '' : `${entry.provider}:${entry.model}`}
                        onSelect={(id) => {
                          setModelOpen(null)
                          const separator = id.indexOf(':')
                          if (separator > 0) {
                            setModelShortcutTarget(index, id.slice(0, separator), id.slice(separator + 1))
                          }
                        }}
                        align="end"
                        portal
                        anchor={(
                          <button
                            type="button"
                            className={css.modelTarget}
                            aria-haspopup="menu"
                            aria-expanded={modelOpen === index}
                            disabled={!state.writable || models.options.length === 0}
                            onClick={() => { setModelOpen(current => current === index ? null : index) }}
                          >
                            {entry.provider === '' || entry.model === ''
                              ? t('modelShortcutPickTarget')
                              : target?.label ?? `${entry.provider} / ${entry.model}`}
                            <IconChevronDownOutline14 className={css.chevron} />
                          </button>
                        )}
                      />
                      <button
                        type="button"
                        className={css.modelRemove}
                        aria-label={t('modelShortcutRemove')}
                        disabled={!state.writable}
                        onClick={() => removeModelShortcut(index)}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {models.status === 'error' && <p className={css.modelDesc}>{t('modelCatalogUnavailable')}</p>}
            {models.status === 'ready' && models.options.length === 0 && <p className={css.modelDesc}>{t('modelCatalogEmpty')}</p>}
            <button
              type="button"
              className={css.modelAdd}
              disabled={!state.writable}
              onClick={addModelShortcut}
            >
              {t('modelShortcutAdd')}
            </button>
          </div>
        </div>
      )}
      <div className={css.footer}>
        {state.dirty ? <span className={css.dirty}>{t('dirty')}</span> : null}
        <button
          type="button"
          className={css.save}
          disabled={!state.dirty || !state.writable || state.saving}
          onClick={save}
        >
          {state.saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  )
}
