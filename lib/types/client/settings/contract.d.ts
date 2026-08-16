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
import type { ShortcutConfig } from '../config.ts';
import { type SettingsScope, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import type { ShortcutAction } from '../shortcuts.ts';
import type { ShortcutsSection } from '../../shared.ts';
/** One selectable model-catalog entry (a provider/model pair). */
export interface ModelOption {
    /** Catalog provider (group) id. */
    provider: string;
    /** Catalog model id within the provider. */
    model: string;
    /** Human label ("provider / model"). */
    label: string;
}
/** The current session's model catalog, as the section renders it. */
export interface ModelCatalogState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    options: ModelOption[];
}
/** What the section renders. */
export interface ShortcutsSettingsState {
    /** Scope sync state (unavailable = not exposed / memory mode). */
    status: 'loading' | 'ready' | 'unavailable';
    /** Whether the Host document accepts writes. */
    writable: boolean;
    /** Effective bindings (section over loader defaults). */
    values: ShortcutConfig;
    /** Staged draft the user is editing. */
    draft: ShortcutConfig;
    /** Whether the draft differs from the effective values. */
    dirty: boolean;
    /** Whether a save is crossing the wire. */
    saving: boolean;
}
/** The settings-section registration face (hooks + form actions). */
export interface ShortcutsSettingsInjected {
    hooks: {
        /** Store rendered via `useShortcuts` (HostObservable shape). */
        shortcuts: HostObservable<ShortcutsSettingsState>;
        /** The workspaces list, for the default-workspace selector. */
        workspaces: HostObservable<{
            items: readonly {
                workspaceId: string;
                title: string;
            }[];
        }>;
        /** The current session's model catalog. */
        models: HostObservable<ModelCatalogState>;
    };
    /** Whether the usage feature is mounted (shows the usagePanel binding row). */
    usageAvailable: boolean;
    setDraft(field: ShortcutAction, spec: string): void;
    setDefaultWorkspace(workspaceId: string): void;
    addModelShortcut(): void;
    removeModelShortcut(index: number): void;
    setModelShortcutCombo(index: number, combo: string): void;
    setModelShortcutTarget(index: number, provider: string, model: string): void;
    save(): void;
    resetField(field: ShortcutAction): void;
}
/** Bridges the ui-custom settings scope onto the section's staged form. */
export declare class ShortcutsSettingsController {
    private readonly scope;
    private readonly loadModels;
    /** The projected snapshot store the section renders. */
    readonly store: SnapshotStore<ShortcutsSettingsState>;
    /** The current session's model catalog store. */
    readonly models: SnapshotStore<ModelCatalogState>;
    private values;
    private draft;
    private saving;
    private alive;
    /**
     * @param scope - the bound settings scope for the ui-custom namespace.
     * @param defaults - loader-config shortcuts (fallback per unset field).
     * @param loadModels - loads the current session's model catalog ('' when none).
     */
    constructor(scope: SettingsScope<ShortcutsSection>, defaults: ShortcutConfig, loadModels: () => Promise<ModelOption[]>);
    /** Re-project from the scope snapshot (called on construction and scope changes). */
    private sync;
    private dirty;
    private publish;
    /** Stage one standard field edit. */
    setDraft(field: ShortcutAction, spec: string): void;
    /** Stage the default workspace for the new-conversation shortcut. */
    setDefaultWorkspace(workspaceId: string): void;
    /** Stage a new (unbound) model shortcut row. */
    addModelShortcut(): void;
    /** Stage removal of one model shortcut row. */
    removeModelShortcut(index: number): void;
    /** Stage one model shortcut's key combo. */
    setModelShortcutCombo(index: number, combo: string): void;
    /** Stage one model shortcut's target model. */
    setModelShortcutTarget(index: number, provider: string, model: string): void;
    /** Stage the field back to its effective value (clears the edit). */
    resetField(field: ShortcutAction): void;
    /** Write every changed field through the scope ('' → unset). */
    save(): Promise<void>;
    /** Load the current session's model catalog into {@link models}. */
    refreshModels(): Promise<void>;
    /** Wire the controller: subscribe the scope and expose the form actions. */
    mount(): {
        dispose: () => void;
        actions: Pick<ShortcutsSettingsInjected, 'setDraft' | 'setDefaultWorkspace' | 'addModelShortcut' | 'removeModelShortcut' | 'setModelShortcutCombo' | 'setModelShortcutTarget' | 'save' | 'resetField'>;
    };
}
//# sourceMappingURL=contract.d.ts.map