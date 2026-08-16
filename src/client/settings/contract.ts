/**
 * Shortcuts settings controller: a staged draft over the ui-custom settings
 * scope, projected into a snapshot store the section component renders, plus
 * the current session's model catalog (for the one-to-one model shortcuts).
 *
 * - `values` = effective bindings (settings section over the loader-config
 *   defaults).
 * - `draft` = the user's staged edits; `dirty` when they differ.
 * - `save()` writes each changed field through the scope ('' → unset so the
 *   field re-inherits the loader default; an emptied modelShortcuts list is
 *   unset too); the scope's publish refreshes the projection.
 */
import type { ShortcutConfig } from '../config.ts'
import { createSnapshotStore, type SettingsScope, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { ShortcutAction } from '../shortcuts.ts'
import type { ModelShortcut, ShortcutsSection } from '../../shared.ts'

/** One selectable model-catalog entry (a provider/model pair). */
export interface ModelOption {
  /** Catalog provider (group) id. */
  provider: string
  /** Catalog model id within the provider. */
  model: string
  /** Human label ("provider / model"). */
  label: string
}

/** The current session's model catalog, as the section renders it. */
export interface ModelCatalogState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  options: ModelOption[]
}

/** What the section renders. */
export interface ShortcutsSettingsState {
  /** Scope sync state (unavailable = not exposed / memory mode). */
  status: 'loading' | 'ready' | 'unavailable'
  /** Whether the Host document accepts writes. */
  writable: boolean
  /** Effective bindings (section over loader defaults). */
  values: ShortcutConfig
  /** Staged draft the user is editing. */
  draft: ShortcutConfig
  /** Whether the draft differs from the effective values. */
  dirty: boolean
  /** Whether a save is crossing the wire. */
  saving: boolean
}

/** The settings-section registration face (hooks + form actions). */
export interface ShortcutsSettingsInjected {
  hooks: {
    /** Store rendered via `useShortcuts` (HostObservable shape). */
    shortcuts: HostObservable<ShortcutsSettingsState>
    /** The workspaces list, for the default-workspace selector. */
    workspaces: HostObservable<{ items: readonly { workspaceId: string; title: string }[] }>
    /** The current session's model catalog. */
    models: HostObservable<ModelCatalogState>
  }
  /** Whether the usage feature is mounted (shows the usagePanel binding row). */
  usageAvailable: boolean
  setDraft(field: ShortcutAction, spec: string): void
  setDefaultWorkspace(workspaceId: string): void
  addModelShortcut(): void
  removeModelShortcut(index: number): void
  setModelShortcutCombo(index: number, combo: string): void
  setModelShortcutTarget(index: number, provider: string, model: string): void
  save(): void
  resetField(field: ShortcutAction): void
}

const SHORTCUT_FIELDS: readonly ShortcutAction[] = [
  'newConversation', 'switchModel', 'cycleThinking', 'sendMessage', 'newline', 'usagePanel',
]

/** Structural equality for the model-shortcut list. */
const sameModelShortcuts = (a: readonly ModelShortcut[], b: readonly ModelShortcut[]): boolean =>
  a.length === b.length && a.every((entry, index) =>
    entry.combo === b[index]?.combo && entry.provider === b[index]?.provider && entry.model === b[index]?.model)

/** Bridges the ui-custom settings scope onto the section's staged form. */
export class ShortcutsSettingsController {
  /** The projected snapshot store the section renders. */
  readonly store: SnapshotStore<ShortcutsSettingsState>
  /** The current session's model catalog store. */
  readonly models: SnapshotStore<ModelCatalogState>
  private values: ShortcutConfig
  private draft: ShortcutConfig
  private saving = false
  private alive = true

  /**
   * @param scope - the bound settings scope for the ui-custom namespace.
   * @param defaults - loader-config shortcuts (fallback per unset field).
   * @param loadModels - loads the current session's model catalog ('' when none).
   */
  constructor(
    private readonly scope: SettingsScope<ShortcutsSection>,
    defaults: ShortcutConfig,
    private readonly loadModels: () => Promise<ModelOption[]>,
  ) {
    this.values = { ...defaults, modelShortcuts: [...defaults.modelShortcuts] }
    this.draft = { ...defaults, modelShortcuts: [...defaults.modelShortcuts] }
    this.models = createSnapshotStore<ModelCatalogState>({ status: 'idle', options: [] })
    this.store = createSnapshotStore<ShortcutsSettingsState>({
      status: 'loading', writable: false,
      values: this.values, draft: this.draft, dirty: false, saving: false,
    })
    this.sync()
  }

  /** Re-project from the scope snapshot (called on construction and scope changes). */
  private sync(): void {
    const snapshot = this.scope.getSnapshot()
    const section = snapshot.value
    const values = { ...this.values }
    for (const field of SHORTCUT_FIELDS) {
      const override = section?.[field]
      values[field] = override === undefined ? this.values[field] : override
    }
    values.defaultWorkspace = section?.defaultWorkspace ?? this.values.defaultWorkspace
    values.modelShortcuts = section?.modelShortcuts ?? this.values.modelShortcuts
    this.values = values
    if (!this.dirty()) this.draft = { ...values, modelShortcuts: [...values.modelShortcuts] }
    this.store.update((state) => {
      state.status = snapshot.status
      state.writable = snapshot.writable
      state.values = values
      state.draft = this.draft
      state.dirty = this.dirty()
      state.saving = this.saving
    })
  }

  private dirty(): boolean {
    return SHORTCUT_FIELDS.some((field) => this.draft[field] !== this.values[field])
      || this.draft.defaultWorkspace !== this.values.defaultWorkspace
      || !sameModelShortcuts(this.draft.modelShortcuts, this.values.modelShortcuts)
  }

  private publish(): void {
    this.store.update((state) => {
      state.values = this.values
      state.draft = this.draft
      state.dirty = this.dirty()
      state.saving = this.saving
    })
  }

  /** Stage one standard field edit. */
  setDraft(field: ShortcutAction, spec: string): void {
    this.draft = { ...this.draft, [field]: spec.trim() }
    this.publish()
  }

  /** Stage the default workspace for the new-conversation shortcut. */
  setDefaultWorkspace(workspaceId: string): void {
    this.draft = { ...this.draft, defaultWorkspace: workspaceId }
    this.publish()
  }

  /** Stage a new (unbound) model shortcut row. */
  addModelShortcut(): void {
    this.draft = {
      ...this.draft,
      modelShortcuts: [...this.draft.modelShortcuts, { combo: '', provider: '', model: '' }],
    }
    this.publish()
  }

  /** Stage removal of one model shortcut row. */
  removeModelShortcut(index: number): void {
    const next = [...this.draft.modelShortcuts]
    next.splice(index, 1)
    this.draft = { ...this.draft, modelShortcuts: next }
    this.publish()
  }

  /** Stage one model shortcut's key combo. */
  setModelShortcutCombo(index: number, combo: string): void {
    this.draft = {
      ...this.draft,
      modelShortcuts: this.draft.modelShortcuts.map((entry, i) =>
        i === index ? { ...entry, combo: combo.trim() } : entry),
    }
    this.publish()
  }

  /** Stage one model shortcut's target model. */
  setModelShortcutTarget(index: number, provider: string, model: string): void {
    this.draft = {
      ...this.draft,
      modelShortcuts: this.draft.modelShortcuts.map((entry, i) =>
        i === index ? { ...entry, provider, model } : entry),
    }
    this.publish()
  }

  /** Stage the field back to its effective value (clears the edit). */
  resetField(field: ShortcutAction): void {
    this.setDraft(field, this.values[field])
  }

  /** Write every changed field through the scope ('' → unset). */
  async save(): Promise<void> {
    if (!this.dirty() || this.saving) return
    this.saving = true
    this.publish()
    try {
      for (const field of SHORTCUT_FIELDS) {
        const next = this.draft[field]
        if (next === this.values[field]) continue
        if (next === '') await this.scope.unset(field)
        else await this.scope.set(field, next)
      }
      const nextWorkspace = this.draft.defaultWorkspace
      if (nextWorkspace !== this.values.defaultWorkspace) {
        if (nextWorkspace === '') await this.scope.unset('defaultWorkspace')
        else await this.scope.set('defaultWorkspace', nextWorkspace)
      }
      const nextModels = this.draft.modelShortcuts
      if (!sameModelShortcuts(nextModels, this.values.modelShortcuts)) {
        if (nextModels.length === 0) await this.scope.unset('modelShortcuts')
        else await this.scope.set('modelShortcuts', nextModels.map(entry => ({ ...entry })))
      }
    } finally {
      this.saving = false
      // The scope's publish (or the recovery read) refreshes values/draft.
      this.sync()
    }
  }

  /** Load the current session's model catalog into {@link models}. */
  async refreshModels(): Promise<void> {
    if (!this.alive) return
    this.models.update((state) => { state.status = 'loading' })
    try {
      const options = await this.loadModels()
      if (!this.alive) return
      this.models.update((state) => { state.status = 'ready'; state.options = options })
    } catch {
      if (!this.alive) return
      this.models.update((state) => { state.status = 'error'; state.options = [] })
    }
  }

  /** Wire the controller: subscribe the scope and expose the form actions. */
  mount(): { dispose: () => void; actions: Pick<ShortcutsSettingsInjected, 'setDraft' | 'setDefaultWorkspace' | 'addModelShortcut' | 'removeModelShortcut' | 'setModelShortcutCombo' | 'setModelShortcutTarget' | 'save' | 'resetField'> } {
    const dispose = this.scope.subscribe(() => this.sync())
    return {
      dispose: () => {
        this.alive = false
        dispose()
      },
      actions: {
        setDraft: (field, spec) => this.setDraft(field, spec),
        setDefaultWorkspace: (workspaceId) => this.setDefaultWorkspace(workspaceId),
        addModelShortcut: () => this.addModelShortcut(),
        removeModelShortcut: (index) => this.removeModelShortcut(index),
        setModelShortcutCombo: (index, combo) => this.setModelShortcutCombo(index, combo),
        setModelShortcutTarget: (index, provider, model) => this.setModelShortcutTarget(index, provider, model),
        save: () => { void this.save() },
        resetField: (field) => this.resetField(field),
      },
    }
  }
}
