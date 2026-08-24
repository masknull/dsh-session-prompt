/**
 * Self-contained build for both halves of the plugin. Contains NO imports:
 * the shared in-repo `clientBundle` preset is not published, so the loader's
 * client-factory artifact format is spelled out here instead.
 *
 * - Node half: `src/index.js` (plain ESM) -> `lib/index.js`.
 * - Browser half: `src/client/index.tsx` -> `lib/client.js`, the lazy-CJS
 *   factory artifact the client module system expects:
 *   `window.__ModuleLoader__.load({ id, factory: (require) => {...} })`
 *   with module-table specifiers left as `require()` calls (the injected
 *   require answers them), everything else inlined.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/** CSS as text: a `.css` import becomes `export default "<css text>"` (no
 * CSS-modules hashing needed — the card uses dedicated class names). */
const CSS_VIRTUAL = '\0shp-css:'
const CSS_SUFFIX = '.mjs'

const cssTextPlugin = {
  name: 'shp-css-text-inline',
  resolveId(source, importer) {
    if (importer === undefined || !source.endsWith('.css') || !source.startsWith('.')) return null
    const base = /^[A-Za-z]:[\\/]|^\/|^file:/.test(importer) ? importer : resolve(process.cwd(), importer)
    return CSS_VIRTUAL + resolve(dirname(base), source) + CSS_SUFFIX
  },
  load(id) {
    if (!id.startsWith(CSS_VIRTUAL) || !id.endsWith(CSS_SUFFIX)) return null
    const file = id.slice(CSS_VIRTUAL.length, -CSS_SUFFIX.length)
    return { code: `export default ${JSON.stringify(readFileSync(file, 'utf8'))}` }
  },
}

const ID = 'dsh-session-prompt'

/**
 * Module-table specifiers the client bundle leaves as require() calls: the
 * platform seed words plus the preloaded runtime row. A type-only import is
 * erased before resolution and never needs to be listed here.
 */
const CLIENT_EXTERNALS = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-runtime/client',
])

/** Client bundle: the loader's lazy-CJS factory artifact. */
const client = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  sourcemap: true,
  clean: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env': JSON.stringify({ MODE: 'production' }),
  },
  deps: {
    neverBundle: (specifier) => CLIENT_EXTERNALS.has(specifier),
    alwaysBundle: (specifier) => !CLIENT_EXTERNALS.has(specifier),
  },
  plugins: [cssTextPlugin],
  outputOptions: {
    entryFileNames: 'client.js',
    // The loader calls the factory with its own require; `module.exports` is
    // what the wrapper returns to the loader.
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

/** Node half: plain ESM copied from src. The @deepseek-ai runtime deps are
 * peer dependencies (resolved from the profile's installed tree at runtime),
 * so they are forced external here — never inlined into the package. */
const node = {
  name: `${ID}/lib`,
  entry: { index: 'src/index.js' },
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  sourcemap: false,
  clean: false,
  deps: {
    neverBundle: (specifier) => nodeExternals.has(specifier),
    alwaysBundle: (specifier) => !nodeExternals.has(specifier),
  },
}

/** Node-half externals: everything the Host tree already provides. */
const nodeExternals = new Set([
  '@deepseek-ai/cordis',
  '@deepseek-ai/schemastery',
  '@deepseek-ai/dsh-settings',
])

export default ({ env }) => {
  // Match the repo preset's face convention: an unset DSH_BUILD_FACE builds
  // every half; a face selects its own.
  const face = env?.DSH_BUILD_FACE
  if (face === 'host') return [node]
  if (face === 'client') return [client]
  return [node, client]
}