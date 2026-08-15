import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { ShortcutAction } from './shortcuts.ts';
import type { ShortcutConfig } from './config.ts';
/**
 * Cycle to the next model in the session's catalog (wraps around; new model
 * starts at its own default reasoning effort).
 * @param ctx - client context with connection/sessions services.
 */
export declare function switchModel(ctx: ClientContext): Promise<void>;
/**
 * Cycle the current model's reasoning effort through its advertised efforts
 * (off → … → max, wrapping; a model without efforts is left untouched).
 * @param ctx - client context with connection/sessions services.
 */
export declare function cycleThinking(ctx: ClientContext): Promise<void>;
/**
 * The current session's model catalog as flat selectable options (empty when
 * there is no session, no connection, or the catalog is unavailable).
 * @param ctx - client context with connection/sessions services.
 * @returns provider/model options for the settings UI.
 */
export declare function modelCatalogOptions(ctx: ClientContext): Promise<Array<{
    provider: string;
    model: string;
    label: string;
}>>;
/**
 * Jump to a specific model in the session's catalog (one-to-one model
 * shortcut). The model's advertised default reasoning effort rides along when
 * the catalog declares one.
 * @param ctx - client context with connection/sessions services.
 * @param provider - catalog provider (group) id.
 * @param model - catalog model id within the provider.
 */
export declare function selectModelDirect(ctx: ClientContext, provider: string, model: string): Promise<void>;
/**
 * Start a new conversation (same action as the sidebar's New Session button).
 * The optional default-workspace shortcut target routes the new conversation
 * into that workspace; without one the workspaces service inherits the
 * current session's workspace / recency projection.
 * @param ctx - client context with the workspaces service.
 * @param shortcuts - the active shortcut config (for the default workspace).
 */
export declare function newConversation(ctx: ClientContext, shortcuts?: ShortcutConfig): void;
type ShortcutHandler = (ctx: ClientContext, shortcuts?: ShortcutConfig) => void | Promise<void>;
/** All dispatcher actions (sendMessage/newline are composer remaps, not dispatcher actions). */
export declare const SHORTCUT_HANDLERS: Readonly<Partial<Record<ShortcutAction, ShortcutHandler>>>;
export {};
//# sourceMappingURL=actions.d.ts.map