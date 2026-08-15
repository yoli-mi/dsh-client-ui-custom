const faces = (ctx) => ctx;
/** Resolve the current session's advisory model directory; null when unusable. */
async function currentSessionModels(ctx) {
    const sessionId = ctx.sessions.list.getSnapshot().current;
    if (sessionId === undefined)
        return null;
    if (ctx.sessions.subagentAddress(sessionId) !== undefined)
        return null;
    const api = faces(ctx).connection?.api.sessions;
    if (api === undefined)
        return null;
    const { result } = await api.models({ sessionId });
    if (!result.ok)
        return null;
    return {
        sessionId,
        api,
        current: result.value.current,
        groups: result.value.groups,
    };
}
/**
 * Cycle to the next model in the session's catalog (wraps around; new model
 * starts at its own default reasoning effort).
 * @param ctx - client context with connection/sessions services.
 */
export async function switchModel(ctx) {
    const models = await currentSessionModels(ctx);
    if (models === null)
        return;
    const flat = models.groups.flatMap((group) => group.models.map((model) => ({
        provider: group.id,
        model: model.id,
        defaultEffort: model.reasoning?.defaultEffort,
    })));
    if (flat.length === 0)
        return;
    const index = flat.findIndex((entry) => entry.provider === models.current.provider && entry.model === models.current.model);
    const next = flat[(index + 1) % flat.length];
    await models.api.selectModel({
        sessionId: models.sessionId,
        provider: next.provider,
        model: next.model,
        ...(next.defaultEffort === undefined ? {} : { reasoningEffort: next.defaultEffort }),
    });
}
/**
 * Cycle the current model's reasoning effort through its advertised efforts
 * (off → … → max, wrapping; a model without efforts is left untouched).
 * @param ctx - client context with connection/sessions services.
 */
export async function cycleThinking(ctx) {
    const models = await currentSessionModels(ctx);
    if (models === null)
        return;
    for (const group of models.groups) {
        for (const model of group.models) {
            if (model.id !== models.current.model || group.id !== models.current.provider)
                continue;
            const efforts = model.reasoning?.efforts ?? [];
            if (efforts.length === 0)
                return;
            const ids = efforts.map((effort) => effort.id);
            const currentIndex = ids.indexOf(models.current.reasoningEffort ?? model.reasoning?.defaultEffort ?? '');
            const nextId = ids[(currentIndex + 1) % ids.length];
            await models.api.selectModel({
                sessionId: models.sessionId,
                provider: models.current.provider,
                model: models.current.model,
                reasoningEffort: nextId,
            });
            return;
        }
    }
}
/**
 * The current session's model catalog as flat selectable options (empty when
 * there is no session, no connection, or the catalog is unavailable).
 * @param ctx - client context with connection/sessions services.
 * @returns provider/model options for the settings UI.
 */
export async function modelCatalogOptions(ctx) {
    const models = await currentSessionModels(ctx);
    if (models === null)
        return [];
    return models.groups.flatMap(group => group.models.map(model => ({
        provider: group.id,
        model: model.id,
        label: `${group.id} / ${model.id}`,
    })));
}
/**
 * Jump to a specific model in the session's catalog (one-to-one model
 * shortcut). The model's advertised default reasoning effort rides along when
 * the catalog declares one.
 * @param ctx - client context with connection/sessions services.
 * @param provider - catalog provider (group) id.
 * @param model - catalog model id within the provider.
 */
export async function selectModelDirect(ctx, provider, model) {
    const models = await currentSessionModels(ctx);
    if (models === null)
        return;
    const entry = models.groups
        .find(group => group.id === provider)
        ?.models.find(candidate => candidate.id === model);
    if (entry === undefined)
        return;
    await models.api.selectModel({
        sessionId: models.sessionId,
        provider,
        model,
        ...(entry.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: entry.reasoning.defaultEffort }),
    });
}
/**
 * Start a new conversation (same action as the sidebar's New Session button).
 * The optional default-workspace shortcut target routes the new conversation
 * into that workspace; without one the workspaces service inherits the
 * current session's workspace / recency projection.
 * @param ctx - client context with the workspaces service.
 * @param shortcuts - the active shortcut config (for the default workspace).
 */
export function newConversation(ctx, shortcuts) {
    faces(ctx).workspaces?.startSession(shortcuts?.defaultWorkspace || undefined);
}
/** All dispatcher actions (sendMessage/newline are composer remaps, not dispatcher actions). */
export const SHORTCUT_HANDLERS = {
    newConversation,
    switchModel,
    cycleThinking,
    usagePanel: () => { void import("./usage-overlay.js").then(({ usageOverlay }) => usageOverlay.toggle()); },
};
//# sourceMappingURL=actions.js.map