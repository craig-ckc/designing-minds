/* -------------------------------------------------------------------------
   Vercel build step: bundle each api/ function into self-contained JS.

   The functions source is written bundler-style — relative imports carry
   explicit .ts extensions (required by the local `node --watch
   --experimental-strip-types` dev server) and @designing-minds/cms ships raw
   TypeScript. Vercel's zero-config function builder can neither follow .ts
   specifiers nor compile TypeScript inside node_modules, so at deploy time we
   pre-bundle every entrypoint with esbuild.

   Vercel records the api/ entrypoint paths before the build command runs, so
   each bundle is written back over its original .ts file (plain JS is valid
   input to the function compiler) rather than emitted alongside it.

   Local dev is unaffected: this script only runs as the Vercel buildCommand.
   ------------------------------------------------------------------------- */

import { build } from 'esbuild'
import { readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const apiDir = join(root, 'api')

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const sources = walk(apiDir).filter((file) => file.endsWith('.ts'))
// Files starting with "_" are shared helpers, not function entrypoints —
// they get bundled into each function that imports them.
const entries = sources.filter((file) => !relative(apiDir, file).split('/').some((part) => part.startsWith('_')))

for (const entry of entries) {
  const result = await build({
    entryPoints: [entry],
    write: false,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    // Real npm dependencies stay external (present in node_modules at
    // runtime); workspace TS (@designing-minds/cms) and relative imports
    // are compiled into the bundle.
    external: ['@supabase/supabase-js', '@vercel/node'],
  })
  writeFileSync(entry, result.outputFiles[0].text)
  console.log(`[bundle-api] bundled ${relative(root, entry)} in place`)
}

console.log(`[bundle-api] bundled ${entries.length} functions`)
