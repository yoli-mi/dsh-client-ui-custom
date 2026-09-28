/**
 * Build driver: `tsc` refreshes the lib/types declaration tree, then tsdown
 * bundles the lib/ artifacts. tsc's exit status is deliberately not fatal —
 * against public-registry @deepseek-ai/* pins it reports era-skew type errors
 * while still emitting — but tsdown failures are (see README, Development).
 */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const root = resolve(import.meta.dirname, '..')

const tsc = spawnSync(npx, ['tsc', '-p', 'tsconfig.json'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})
if (tsc.error) throw tsc.error
if (tsc.status !== 0) {
  console.warn(`[build] tsc exited ${tsc.status} (type-era skew tolerated); emitted lib/types anyway`)
}

const tsdown = spawnSync(npx, ['tsdown'], { cwd: root, stdio: 'inherit', shell: true })
if (tsdown.error) throw tsdown.error
process.exit(tsdown.status ?? 1)
