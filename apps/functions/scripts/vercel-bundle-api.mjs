/* -------------------------------------------------------------------------
   Vercel build step: bundle each api/ function into a self-contained .mjs.

   The functions source is written bundler-style — relative imports carry
   explicit .ts extensions (required by the local `node --watch
   --experimental-strip-types` dev server) and @designing-minds/cms ships raw
   TypeScript. Vercel's zero-config function builder can neither follow .ts
   specifiers nor compile TypeScript inside node_modules, so at deploy time we
   pre-bundle every entrypoint with esbuild and remove the .ts sources from
   api/ so only the bundles are picked up as functions.

   Local dev is unaffected: this script only runs as the Vercel buildCommand.
   ------------------------------------------------------------------------- */

import { build } from 'esbuild'
import { readdirSync, rmSync } from 'node:fs'
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
  const outfile = entry.replace(/\.ts$/, '.mjs')
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    // Real npm dependencies stay external (present in node_modules at
    // runtime); workspace TS (@designing-minds/cms) and relative imports
    // are compiled into the bundle.
    external: ['@supabase/supabase-js', '@vercel/node'],
  })
  console.log(`[bundle-api] ${relative(root, entry)} -> ${relative(root, outfile)}`)
}

// Remove the .ts sources so Vercel only sees the bundled functions.
for (const file of sources) rmSync(file)
console.log(`[bundle-api] bundled ${entries.length} functions, removed ${sources.length} .ts sources`)
