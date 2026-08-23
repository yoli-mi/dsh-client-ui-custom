import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** The "快捷键" settings section: six recordable bindings, the default
 * workspace for the new-conversation shortcut, one-to-one model shortcuts,
 * and the save/reset footer. */
import { useState } from 'react';
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import { KeyCapture } from "./KeyCapture.js";
import css from './ShortcutsSection.module.css';
/** The rows, in display order. */
const ROWS = [
    { field: 'newConversation', label: 'newConversation' },
    { field: 'switchModel', label: 'switchModel' },
    { field: 'cycleThinking', label: 'cycleThinking' },
    { field: 'sendMessage', label: 'sendMessage' },
    { field: 'newline', label: 'newline' },
    { field: 'usagePanel', label: 'usagePanel' },
];
/**
 * Render the shortcuts section content.
 * @param props - composed slot props + injected controller face.
 */
export function ShortcutsSection({ t, useShortcuts, useWorkspaces, useModels, setDraft, save, resetField, setDefaultWorkspace, addModelShortcut, removeModelShortcut, setModelShortcutCombo, setModelShortcutTarget, usageAvailable, }) {
    const state = useShortcuts((value) => value);
    const workspaces = useWorkspaces((value) => value);
    const models = useModels((value) => value);
    const [wsOpen, setWsOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(null);
    const items = workspaces?.items ?? [];
    // Cross-feature gate: the usage-panel binding only makes sense (and only
    // dispatches) when the usage feature is mounted too.
    const rows = ROWS.filter((row) => row.field !== 'usagePanel' || usageAvailable);
    return (_jsxs("div", { className: css.section, "data-dsu-motion": "fade-up", children: [_jsx("h2", { className: css.heading, children: t('title') }), _jsx("p", { className: css.intro, children: t('intro') }), state.status === 'unavailable' ? (_jsxs("div", { className: css.unavailable, children: [_jsx("p", { children: t('unavailable') }), _jsx("p", { className: css.unavailableHint, children: t('unavailableHint') })] })) : (_jsxs("div", { className: css.rows, children: [rows.map((row) => (_jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: `shortcut-${row.field}`, children: t(row.label) }), _jsx(KeyCapture, { id: `shortcut-${row.field}`, value: state.draft[row.field], onChange: (spec) => setDraft(row.field, spec), t: t, disabled: !state.writable }), _jsx("button", { type: "button", className: css.reset, disabled: !state.writable, onClick: () => resetField(row.field), children: t('reset') })] }, row.field))), _jsxs("div", { className: css.row, children: [_jsx("label", { className: css.label, htmlFor: "default-workspace", children: t('defaultWorkspaceTitle') }), _jsx(Menu, { open: wsOpen, onClose: () => { setWsOpen(false); }, items: [
                                    { id: '', label: t('defaultWorkspaceNone') },
                                    ...items.map(workspace => ({ id: workspace.workspaceId, label: workspace.title })),
                                ], selectedId: state.draft.defaultWorkspace, onSelect: (id) => {
                                    setWsOpen(false);
                                    setDefaultWorkspace(id);
                                }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", id: "default-workspace", className: css.selector, "aria-haspopup": "menu", "aria-expanded": wsOpen, disabled: !state.writable, onClick: () => { setWsOpen(value => !value); }, children: [state.draft.defaultWorkspace === ''
                                            ? t('defaultWorkspaceNone')
                                            : (items.find(workspace => workspace.workspaceId === state.draft.defaultWorkspace)?.title ?? state.draft.defaultWorkspace), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) })] }), _jsx("p", { className: css.rowDesc, children: t('defaultWorkspaceDesc') }), _jsxs("div", { className: css.modelBlock, children: [_jsx("div", { className: css.modelTitle, children: t('modelShortcutTitle') }), _jsx("p", { className: css.modelDesc, children: t('modelShortcutDesc') }), state.draft.modelShortcuts.length === 0 ? (_jsx("p", { className: css.modelEmpty, children: t('modelShortcutEmpty') })) : (_jsx("div", { className: css.modelList, children: state.draft.modelShortcuts.map((entry, index) => {
                                    const target = models.options.find(option => option.provider === entry.provider && option.model === entry.model);
                                    return (_jsxs("div", { className: css.modelRow, children: [_jsx(KeyCapture, { id: `model-shortcut-${index}`, value: entry.combo, onChange: (spec) => setModelShortcutCombo(index, spec), t: t, disabled: !state.writable }), _jsx(Menu, { open: modelOpen === index, onClose: () => { setModelOpen(null); }, items: models.options.map(option => ({
                                                    id: `${option.provider}:${option.model}`,
                                                    label: option.label,
                                                })), selectedId: entry.provider === '' || entry.model === '' ? '' : `${entry.provider}:${entry.model}`, onSelect: (id) => {
                                                    setModelOpen(null);
                                                    const separator = id.indexOf(':');
                                                    if (separator > 0) {
                                                        setModelShortcutTarget(index, id.slice(0, separator), id.slice(separator + 1));
                                                    }
                                                }, align: "end", portal: true, anchor: (_jsxs("button", { type: "button", className: css.modelTarget, "aria-haspopup": "menu", "aria-expanded": modelOpen === index, disabled: !state.writable || models.options.length === 0, onClick: () => { setModelOpen(current => current === index ? null : index); }, children: [entry.provider === '' || entry.model === ''
                                                            ? t('modelShortcutPickTarget')
                                                            : target?.label ?? `${entry.provider} / ${entry.model}`, _jsx(IconChevronDownOutline14, { className: css.chevron })] })) }), _jsx("button", { type: "button", className: css.modelRemove, "aria-label": t('modelShortcutRemove'), disabled: !state.writable, onClick: () => removeModelShortcut(index), children: "\u2715" })] }, index));
                                }) })), models.status === 'error' && _jsx("p", { className: css.modelDesc, children: t('modelCatalogUnavailable') }), models.status === 'ready' && models.options.length === 0 && _jsx("p", { className: css.modelDesc, children: t('modelCatalogEmpty') }), _jsx("button", { type: "button", className: css.modelAdd, disabled: !state.writable, onClick: addModelShortcut, children: t('modelShortcutAdd') })] })] })), _jsxs("div", { className: css.footer, children: [state.dirty ? _jsx("span", { className: css.dirty, children: t('dirty') }) : null, _jsx("button", { type: "button", className: css.save, disabled: !state.dirty || !state.writable || state.saving, onClick: save, children: state.saving ? t('saving') : t('save') })] })] }));
}
//# sourceMappingURL=ShortcutsSection.js.map