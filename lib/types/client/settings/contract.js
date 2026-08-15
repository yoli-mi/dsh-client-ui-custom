import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
const SHORTCUT_FIELDS = [
    'newConversation', 'switchModel', 'cycleThinking', 'sendMessage', 'newline', 'usagePanel',
];
/** Structural equality for the model-shortcut list. */
const sameModelShortcuts = (a, b) => a.length === b.length && a.every((entry, index) => entry.combo === b[index]?.combo && entry.provider === b[index]?.provider && entry.model === b[index]?.model);
/** Bridges the ui-custom settings scope onto the section's staged form. */
export class ShortcutsSettingsController {
    scope;
    loadModels;
    /** The projected snapshot store the section renders. */
    store;
    /** The current session's model catalog store. */
    models;
    values;
    draft;
    saving = false;
    alive = true;
    /**
     * @param scope - the bound settings scope for the ui-custom namespace.
     * @param defaults - loader-config shortcuts (fallback per unset field).
     * @param loadModels - loads the current session's model catalog ('' when none).
     */
    constructor(scope, defaults, loadModels) {
        this.scope = scope;
        this.loadModels = loadModels;
        this.values = { ...defaults, modelShortcuts: [...defaults.modelShortcuts] };
        this.draft = { ...defaults, modelShortcuts: [...defaults.modelShortcuts] };
        this.models = createSnapshotStore({ status: 'idle', options: [] });
        this.store = createSnapshotStore({
            status: 'loading', writable: false,
            values: this.values, draft: this.draft, dirty: false, saving: false,
        });
        this.sync();
    }
    /** Re-project from the scope snapshot (called on construction and scope changes). */
    sync() {
        const snapshot = this.scope.getSnapshot();
        const section = snapshot.value;
        const values = { ...this.values };
        for (const field of SHORTCUT_FIELDS) {
            const override = section?.[field];
            values[field] = override === undefined ? this.values[field] : override;
        }
        values.defaultWorkspace = section?.defaultWorkspace ?? this.values.defaultWorkspace;
        values.modelShortcuts = section?.modelShortcuts ?? this.values.modelShortcuts;
        this.values = values;
        if (!this.dirty())
            this.draft = { ...values, modelShortcuts: [...values.modelShortcuts] };
        this.store.update((state) => {
            state.status = snapshot.status;
            state.writable = snapshot.writable;
            state.values = values;
            state.draft = this.draft;
            state.dirty = this.dirty();
            state.saving = this.saving;
        });
    }
    dirty() {
        return SHORTCUT_FIELDS.some((field) => this.draft[field] !== this.values[field])
            || this.draft.defaultWorkspace !== this.values.defaultWorkspace
            || !sameModelShortcuts(this.draft.modelShortcuts, this.values.modelShortcuts);
    }
    publish() {
        this.store.update((state) => {
            state.values = this.values;
            state.draft = this.draft;
            state.dirty = this.dirty();
            state.saving = this.saving;
        });
    }
    /** Stage one standard field edit. */
    setDraft(field, spec) {
        this.draft = { ...this.draft, [field]: spec.trim() };
        this.publish();
    }
    /** Stage the default workspace for the new-conversation shortcut. */
    setDefaultWorkspace(workspaceId) {
        this.draft = { ...this.draft, defaultWorkspace: workspaceId };
        this.publish();
    }
    /** Stage a new (unbound) model shortcut row. */
    addModelShortcut() {
        this.draft = {
            ...this.draft,
            modelShortcuts: [...this.draft.modelShortcuts, { combo: '', provider: '', model: '' }],
        };
        this.publish();
    }
    /** Stage removal of one model shortcut row. */
    removeModelShortcut(index) {
        const next = [...this.draft.modelShortcuts];
        next.splice(index, 1);
        this.draft = { ...this.draft, modelShortcuts: next };
        this.publish();
    }
    /** Stage one model shortcut's key combo. */
    setModelShortcutCombo(index, combo) {
        this.draft = {
            ...this.draft,
            modelShortcuts: this.draft.modelShortcuts.map((entry, i) => i === index ? { ...entry, combo: combo.trim() } : entry),
        };
        this.publish();
    }
    /** Stage one model shortcut's target model. */
    setModelShortcutTarget(index, provider, model) {
        this.draft = {
            ...this.draft,
            modelShortcuts: this.draft.modelShortcuts.map((entry, i) => i === index ? { ...entry, provider, model } : entry),
        };
        this.publish();
    }
    /** Stage the field back to its effective value (clears the edit). */
    resetField(field) {
        this.setDraft(field, this.values[field]);
    }
    /** Write every changed field through the scope ('' → unset). */
    async save() {
        if (!this.dirty() || this.saving)
            return;
        this.saving = true;
        this.publish();
        try {
            for (const field of SHORTCUT_FIELDS) {
                const next = this.draft[field];
                if (next === this.values[field])
                    continue;
                if (next === '')
                    await this.scope.unset(field);
                else
                    await this.scope.set(field, next);
            }
            const nextWorkspace = this.draft.defaultWorkspace;
            if (nextWorkspace !== this.values.defaultWorkspace) {
                if (nextWorkspace === '')
                    await this.scope.unset('defaultWorkspace');
                else
                    await this.scope.set('defaultWorkspace', nextWorkspace);
            }
            const nextModels = this.draft.modelShortcuts;
            if (!sameModelShortcuts(nextModels, this.values.modelShortcuts)) {
                if (nextModels.length === 0)
                    await this.scope.unset('modelShortcuts');
                else
                    await this.scope.set('modelShortcuts', nextModels.map(entry => ({ ...entry })));
            }
        }
        finally {
            this.saving = false;
            // The scope's publish (or the recovery read) refreshes values/draft.
            this.sync();
        }
    }
    /** Load the current session's model catalog into {@link models}. */
    async refreshModels() {
        if (!this.alive)
            return;
        this.models.update((state) => { state.status = 'loading'; });
        try {
            const options = await this.loadModels();
            if (!this.alive)
                return;
            this.models.update((state) => { state.status = 'ready'; state.options = options; });
        }
        catch {
            if (!this.alive)
                return;
            this.models.update((state) => { state.status = 'error'; state.options = []; });
        }
    }
    /** Wire the controller: subscribe the scope and expose the form actions. */
    mount() {
        const dispose = this.scope.subscribe(() => this.sync());
        return {
            dispose: () => {
                this.alive = false;
                dispose();
            },
            actions: {
                setDraft: (field, spec) => this.setDraft(field, spec),
                setDefaultWorkspace: (workspaceId) => this.setDefaultWorkspace(workspaceId),
                addModelShortcut: () => this.addModelShortcut(),
                removeModelShortcut: (index) => this.removeModelShortcut(index),
                setModelShortcutCombo: (index, combo) => this.setModelShortcutCombo(index, combo),
                setModelShortcutTarget: (index, provider, model) => this.setModelShortcutTarget(index, provider, model),
                save: () => { void this.save(); },
                resetField: (field) => this.resetField(field),
            },
        };
    }
}
//# sourceMappingURL=contract.js.map