/**
 * Package-owned invariant companion for `@ha-na-bi/dsh-client-ui-custom`.
 * @module @ha-na-bi/dsh-client-ui-custom/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@ha-na-bi/dsh-client-ui-custom'

/** Cordis companion plugin name. */
export const name = 'client-ui-custom-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: this package only rewrites theme tokens from config;
 * it holds no cross-plugin mutable state and emits no cordis events.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
