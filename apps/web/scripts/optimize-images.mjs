// Static image optimizer. Runs after `vite build` (which copies public/ into
// dist/) and before the prerender step copies dist/ into the Vercel output.
//
// For every eligible raster image in the build output it:
//   1. writes an AVIF sibling (the primary, smallest format), and
//   2. re-compresses the original PNG/JPEG in place as the <picture> fallback.
//
// It operates on the BUILD OUTPUT, never the committed files in public/. Vite
// regenerates dist/ from pristine originals each build, so repeated builds can
// never progressively degrade a lossy image (no generational loss) and the git
// working tree stays clean.
//
// Consumption: use the <Picture> helper (src/components/ui/Picture.tsx), which
// emits <source type="image/avif"> with the original as fallback in production.
//
// Excluded on purpose: og-image.png and favicons — social/link-preview crawlers
// (WhatsApp, Facebook, LinkedIn, X, Slack, iMessage) and favicon consumers do
// not support AVIF, and these must stay in their original format.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = path.dirname(fileURLToPath(import.meta.url))
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(here, '..', 'dist')

/* --------------------------------- Config ------------------------------ */

/** Source formats we convert to AVIF + recompress. (GIF/SVG are left alone.) */
const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

/** Basenames that must keep their original format (no AVIF, no recompression). */
const EXCLUDE_BASENAMES = new Set(['og-image.png', 'favicon.png', 'apple-touch-icon.png'])

/** Encoder settings. Tune here; AVIF is the primary, the fallback is smaller too. */
const AVIF = { quality: 50, effort: 5 }
const JPEG = { quality: 80, mozjpeg: true }
// palette quantization shrinks UI/graphic PNGs a lot; safe here because we only
// touch build output, never the source. Drop `palette` for photographic PNGs.
const PNG = { compressionLevel: 9, effort: 8, palette: true, quality: 80 }

/* --------------------------------- Walk -------------------------------- */

async function* walk(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

const fmtKb = (bytes) => `${(bytes / 1024).toFixed(1)}kB`

/* ------------------------------- Optimize ------------------------------ */

let originals = 0
let avifs = 0
let savedFallback = 0
let savedTotal = 0 // original bytes minus (compressed fallback + avif)

for await (const file of walk(targetDir)) {
  const ext = path.extname(file).toLowerCase()
  if (!RASTER_EXT.has(ext)) continue
  if (EXCLUDE_BASENAMES.has(path.basename(file))) continue

  // Read into a buffer first so we can safely rewrite the same path.
  const input = await readFile(file)
  const before = input.length

  // 1. AVIF sibling (primary format).
  const avifPath = file.slice(0, -ext.length) + '.avif'
  const avifBuf = await sharp(input).avif(AVIF).toBuffer()
  await writeFile(avifPath, avifBuf)

  // 2. Recompress the original in place as the fallback.
  const encoder = ext === '.png' ? sharp(input).png(PNG) : sharp(input).jpeg(JPEG)
  const fallbackBuf = ext === '.webp' ? await sharp(input).webp({ quality: 80 }).toBuffer() : await encoder.toBuffer()
  // Never let recompression make a file larger than the original.
  const keptFallback = fallbackBuf.length < before ? fallbackBuf : input
  await writeFile(file, keptFallback)

  originals += 1
  avifs += 1
  savedFallback += before - keptFallback.length
  savedTotal += before - Math.min(keptFallback.length, avifBuf.length)

  const rel = path.relative(targetDir, file)
  console.log(
    `[optimize-images] ${rel}: ${fmtKb(before)} → fallback ${fmtKb(keptFallback.length)}, avif ${fmtKb(avifBuf.length)}`,
  )
}

if (originals === 0) {
  console.log(`[optimize-images] No eligible raster images in ${path.relative(process.cwd(), targetDir)} (nothing to do).`)
} else {
  console.log(
    `[optimize-images] Optimized ${originals} image(s): +${avifs} AVIF, fallback saved ${fmtKb(savedFallback)}, ` +
      `best-case payload saved ${fmtKb(savedTotal)}.`,
  )
}
