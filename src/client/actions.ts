/**
 * Shortcut actions: what each keybinding does.
 *
 * - `switchModel` / `cycleThinking` read the session's advisory model
 *   directory (`session.models`) and submit through `session.selectModel` —
 *   the same RPC the model-selection UI uses, so the Host stays the single
 *   fact source and the composer seat updates automatically.
 * - `newConversation` rides the shared New Session action (`workspaces`),
 *   exactly like the sidebar's New Session button.
 *
 * Addressed subagent sessions are skipped: those Agent-bound RPCs would
 * activate persisted history outside the direct-parent continuation path
 * (the same guard ui-model-selection applies).
 */
import type { ConnectionHandle, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ShortcutAction } from './shortcuts.ts'
import type { ShortcutConfig } from './config.ts'

/** The session wire face both model actions need. */
type SessionsApi = ConnectionHandle['api']['sessions']

/** ClientContext services this module relies on (inject-declared, not typed on the base Context). */
type ShortcutFaces = {
  connection?: ConnectionHandle
  workspaces?: { startSession(workspaceId?: unknown): void }
}

const faces = (ctx: ClientContext): ShortcutFaces => ctx as unknown as ShortcutFaces

/** Resolve the current session's advisory model directory; null when unusable. */
async function currentSessionModels(
  ctx: ClientContext,
): Promise<{ sessionId: SessionId; api: SessionsApi; current: { provider: string; model: string; reasoningEffort?: string }; groups: readonly { id: string; models: readonly { id: string; reasoning?: { efforts?: readonly { id: string }[]; defaultEffort?: string } }[] }[] } | null> {
  const sessionId = ctx.sessions.list.getSnapshot().current
  if (sessionId === undefined) return null
  if (ctx.sessions.subagentAddress(sessionId) !== undefined) return null
  const api = faces(ctx).connection?.api.sessions
  if (api === undefined) return null
  const { result } = await api.models({ sessionId })
  if (!result.ok) return null
  return {
    sessionId,
    api,
    current: result.value.current,
    groups: result.value.groups,
  }
}

/**
 * Cycle to the next model in the session's catalog (wraps around; new model
 * starts at its own default reasoning effort).
 * @param ctx - client context with connection/sessions services.
 */
export async function switchModel(ctx: ClientContext): Promise<void> {
  const models = await currentSessionModels(ctx)
  if (models === null) return
  const flat = models.groups.flatMap((group) => group.models.map((model) => ({
    provider: group.id,
    model: model.id,
    defaultEffort: model.reasoning?.defaultEffort,
  })))
  if (flat.length === 0) return
  const index = flat.findIndex(
    (entry) => entry.provider === models.current.provider && entry.model === models.current.model,
  )
  const next = flat[(index + 1) % flat.length]!
  await models.api.selectModel({
    sessionId: models.sessionId,
    provider: next.provider,
    model: next.model,
    ...(next.defaultEffort === undefined ? {} : { reasoningEffort: next.defaultEffort }),
  })
}

/**
 * Cycle the current model's reasoning effort through its advertised efforts
 * (off → … → max, wrapping; a model without efforts is left untouched).
 * @param ctx - client context with connection/sessions services.
 */
export async function cycleThinking(ctx: ClientContext): Promise<void> {
  const models = await currentSessionModels(ctx)
  if (models === null) return
  for (const group of models.groups) {
    for (const model of group.models) {
      if (model.id !== models.current.model || group.id !== models.current.provider) continue
      const efforts = model.reasoning?.efforts ?? []
      if (efforts.length === 0) return
      const ids = efforts.map((effort) => effort.id)
      const currentIndex = ids.indexOf(models.current.reasoningEffort ?? model.reasoning?.defaultEffort ?? '')
      const nextId = ids[(currentIndex + 1) % ids.length]!
      await models.api.selectModel({
        sessionId: models.sessionId,
        provider: models.current.provider,
        model: models.current.model,
        reasoningEffort: nextId,
      })
      return
    }
  }
}

/**
 * The current session's model catalog as flat selectable options (empty when
 * there is no session, no connection, or the catalog is unavailable).
 * @param ctx - client context with connection/sessions services.
 * @returns provider/model options for the settings UI.
 */
export async function modelCatalogOptions(
  ctx: ClientContext,
): Promise<Array<{ provider: string; model: string; label: string }>> {
  const models = await currentSessionModels(ctx)
  if (models === null) return []
  return models.groups.flatMap(group => group.models.map(model => ({
    provider: group.id,
    model: model.id,
    label: `${group.id} / ${model.id}`,
  })))
}

/**
 * Jump to a specific model in the session's catalog (one-to-one model
 * shortcut). The model's advertised default reasoning effort rides along when
 * the catalog declares one.
 * @param ctx - client context with connection/sessions services.
 * @param provider - catalog provider (group) id.
 * @param model - catalog model id within the provider.
 */
export async function selectModelDirect(ctx: ClientContext, provider: string, model: string): Promise<void> {
  const models = await currentSessionModels(ctx)
  if (models === null) return
  const entry = models.groups
    .find(group => group.id === provider)
    ?.models.find(candidate => candidate.id === model)
  if (entry === undefined) return
  await models.api.selectModel({
    sessionId: models.sessionId,
    provider,
    model,
    ...(entry.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: entry.reasoning.defaultEffort }),
  })
}

/**
 * Start a new conversation (same action as the sidebar's New Session button).
 * The optional default-workspace shortcut target routes the new conversation
 * into that workspace; without one the workspaces service inherits the
 * current session's workspace / recency projection.
 * @param ctx - client context with the workspaces service.
 * @param shortcuts - the active shortcut config (for the default workspace).
 */
export function newConversation(ctx: ClientContext, shortcuts?: ShortcutConfig): void {
  faces(ctx).workspaces?.startSession(shortcuts?.defaultWorkspace || undefined)
}

type ShortcutHandler = (ctx: ClientContext, shortcuts?: ShortcutConfig) => void | Promise<void>

/** All dispatcher actions (sendMessage/newline are composer remaps, not dispatcher actions). */
export const SHORTCUT_HANDLERS: Readonly<Partial<Record<ShortcutAction, ShortcutHandler>>> = {
  newConversation,
  switchModel,
  cycleThinking,
  usagePanel: () => { void import('./usage-overlay.ts').then(({ usageOverlay }) => usageOverlay.toggle()) },
}
