/**
 * Self-contained build (issue #3): this config used to import a shared
 * `../tsdown.client.ts` from outside the repository, so a fresh clone could
 * not build. Everything the bundle needs now lives here.
 *
 * Bundles straight from TypeScript sources (rolldown transpiles without
 * typechecking — full type resolution needs the DSH-profile workspace of the
 * plugin's target era; see the README verification note):
 *   - src/index.ts, src/invariant.ts → lib/*.js (node, ESM,
 *     @deepseek-ai/* kept external — provided by the DSH host)
 *   - src/client/index.ts → lib/client.js (browser bundle wrapped in the DSH
 *     client-module loader call `window.__ModuleLoader__.load`)
 *
 * `tsc -p tsconfig.json` separately refreshes the committed lib/types/
 * declaration tree (best-effort against public-registry pins).
 */
import * as esbuild from 'esbuild'
import { basename, dirname, resolve } from 'node:path'
import { defineConfig } from 'tsdown'

const PACKAGE_ID = '@ha-na-bi/dsh-client-ui-custom'

/** Host-provided client modules — resolved through the factory's `require`. */
const CLIENT_EXTERNALS = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  /^@deepseek-ai\//,
]

/**
 * Wraps a browser bundle into the DSH client-module loader envelope: the host
 * calls `factory(require)` with its module table; the factory must return the
 * module's exports synchronously. `@deepseek-ai/dsh-client-runtime` must NOT
 * be required by the bundle anymore (issue #4): DSH 0.1.2 hosts dropped that
 * package from the module table, and one missed require took the whole client
 * bundle down.
 */
function moduleLoaderWrap(): import('rolldown').Plugin {
  return {
    name: 'dsh-client-module-loader-wrap',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry) continue
        const body = [
          'var module = { exports: {} };',
          'var exports = module.exports;',
          'Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
          chunk.code,
          'return module.exports;',
        ].join('\n')
        chunk.code = `window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(PACKAGE_ID)},\n\tfactory: (require) => {\n${body}\n\t}\n});\n`
        // the envelope prepends three lines before the original chunk; shift
        // the existing segments down instead of dropping the map entirely
        if (chunk.map) chunk.map.mappings = `;;;${chunk.map.mappings}`
      }
    },
  }
}

/**
 * CSS modules for the browser bundle, in the shape the previous (external)
 * build produced: esbuild renames the classes (`local-css` loader, hashed
 * names), and the generated module injects one `<style
 * data-plugin-css="pkg/file.module.css">` tag per file on first import and
 * exports the class map as its default export. rolldown dropped its
 * experimental CSS bundling (rolldown#4271), hence this local plugin.
 */
function dshCssModules(): import('rolldown').Plugin {
  const PREFIX = '\0dsh-css:'
  return {
    name: 'dsh-css-modules',
    resolveId(id, importer) {
      if (!id.endsWith('.module.css')) return null
      if (id.startsWith(PREFIX)) return id
      const importerDir = importer === undefined ? '.' : dirname(importer)
      return PREFIX + resolve(importerDir, id) + '.mjs'
    },
    async load(id) {
      if (!id.startsWith(PREFIX)) return null
      const cssFile = id.slice(PREFIX.length).replace(/\.mjs$/, '')
      const built = await esbuild.build({
        stdin: {
          contents: `export { default } from ${JSON.stringify(cssFile)}`,
          loader: 'js',
          resolveDir: dirname(cssFile),
        },
        bundle: true,
        format: 'esm',
        write: false,
        outdir: 'tsdown-css-virtual',
        minify: true,
        loader: { '.module.css': 'local-css' },
        logLevel: 'silent',
      })
      let cssText = ''
      let mapModule = ''
      for (const out of built.outputFiles) {
        if (out.path.endsWith('.css')) cssText = out.text.trim()
        else mapModule = out.text
      }
      const tagId = `${PACKAGE_ID}/${basename(cssFile)}`
      const inject = [
        `const css = ${JSON.stringify(cssText)};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {',
        '\tconst tag = document.createElement("style");',
        `\ttag.dataset.plugin = ${JSON.stringify(PACKAGE_ID)};`,
        '\ttag.dataset.pluginCss = tagId;',
        '\ttag.textContent = css;',
        '\tdocument.head.appendChild(tag);',
        '}',
      ].join('\n')
      return `${inject}\n${mapModule}`
    },
  }
}

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      invariant: 'src/invariant.ts',
    },
    outDir: 'lib',
    // lib/ also carries the committed lib/types declaration tree — tsdown
    // must not clean the output directory (it wiped it during development
    // of this config)
    clean: false,
    format: 'esm',
    platform: 'node',
    external: [/^@deepseek-ai\//],
    dts: false,
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    clean: false,
    format: 'cjs',
    platform: 'browser',
    external: CLIENT_EXTERNALS,
    plugins: [dshCssModules(), moduleLoaderWrap()],
    sourcemap: true,
    dts: false,
    // the loader envelope is not real CJS — keep the historical .js name
    outExtensions: () => ({ js: '.js' }),
  },
])
