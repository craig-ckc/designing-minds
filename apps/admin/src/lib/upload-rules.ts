// Explicit extension (allowImportingTsExtensions) so this module also loads in
// the Node test runner, which does not resolve extensionless specifiers.
import { formatBytes, type UploadPurpose } from './upload-transport.ts'

/* -------------------------------------------------------------------------
   What each drop zone will take, checked BEFORE any bytes move.

   Both rules here exist because storage enforced them only after the whole
   file had been sent — or, worse, did not enforce them at all:

   SIZE. Supabase refuses anything over its project-wide upload limit. The
   editor still spent minutes pushing a 109MB PDF up a home connection before
   being told, and the telling was a bare "Upload failed (400)". Checking the
   size locally costs nothing and turns a long wait into an instant answer.

   TYPE. Storage does not care what a bucket receives, so a PDF dropped on the
   preview-IMAGE zone was stored happily and became an <img> on the website
   pointing at a PDF. `accept` on the file input does not prevent it: it filters
   the picker's dialog and is ignored entirely by drag & drop, which is how six
   PDFs ended up in the gallery folder. So the rule has to be enforced in code.
   ------------------------------------------------------------------------- */

/**
 * The project-wide upload ceiling, in bytes.
 *
 * 52,428,800 = 50 MiB, verified against the live project rather than assumed:
 * a resumable-upload claim of exactly 52,428,800 is accepted and 52,428,801 is
 * refused with "Maximum size exceeded". It is the Supabase default and it is a
 * PROJECT setting (Dashboard → Storage → Settings → "Upload file size limit"),
 * not a property of any bucket — so raising it there means changing it here.
 *
 * A plain constant rather than a VITE_ variable on purpose: those are baked in
 * at build time, so overriding it would still need a redeploy — the env var
 * would buy nothing and add a second place for the number to be wrong.
 *
 * Getting it wrong in either direction is survivable: too high and the upload
 * fails at storage with the message explainUploadFailure() writes, too low and
 * the editor is told a smaller number than storage would really accept. It is
 * not a security boundary — storage enforces the real limit regardless of what
 * this file says. If the project setting is raised, change this and re-run
 * tests/admin/upload-rules.test.ts, which pins the number.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/** `50 MB` — how the limit is written in the interface and in Supabase's own settings. */
export const MAX_UPLOAD_LABEL = `${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB`

/** What one drop zone accepts, in the three forms the interface needs. */
interface UploadRule {
  /** For the file input's `accept` — narrows the picker, and nothing more. */
  accept: string
  /** Named in the drop zone and in a rejection, e.g. `PDF or ZIP`. */
  kinds: string
  /** Extensions to fall back on: a ZIP arrives as any of three MIME types, and sometimes none. */
  extensions: string[]
  /** MIME prefixes this zone accepts. */
  mimes: string[]
}

/**
 * One rule per purpose, which is also one rule per drop zone — the purpose is
 * already what decides the bucket, so it is the right thing to key on.
 *
 * The type lists are what the catalogue actually holds: purchased files are
 * PDFs and a handful of ZIP bundles, previews are PDFs, and the gallery is
 * images the website renders in an <img>.
 */
export const uploadRules: Record<UploadPurpose, UploadRule> = {
  purchased: {
    accept: 'application/pdf,.pdf,application/zip,.zip',
    kinds: 'PDF or ZIP',
    extensions: ['.pdf', '.zip'],
    mimes: ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
  },
  /* Listed formats rather than `image/*`, which would also wave through
     image/svg+xml — an SVG is a script-bearing document, and these land in the
     PUBLIC bucket that the website embeds. Every one of the 700 gallery images
     is a PNG, so naming the raster formats costs nothing. */
  gallery: {
    accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif',
    kinds: 'PNG, JPG, WebP, GIF or AVIF',
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'],
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
  },
  preview: {
    accept: 'application/pdf,.pdf',
    kinds: 'PDF',
    extensions: ['.pdf'],
    mimes: ['application/pdf'],
  },
}

/** `PDF or ZIP · up to 50 MB` — the promise a drop zone makes before anything is picked. */
export const uploadHint = (purpose: UploadPurpose) => `${uploadRules[purpose].kinds} · up to ${MAX_UPLOAD_LABEL}`

/**
 * `a PDF`, `a PNG`, `a DOCX file` — the file's kind in the words an editor uses.
 *
 * A refusal that says "not application/vnd.openxmlformats-officedocument…" is
 * technically correct and reads like a stack trace.
 */
const describeKind = (file: { name: string; type: string }): string => {
  const friendly: Record<string, string> = {
    'application/pdf': 'a PDF',
    'application/zip': 'a ZIP',
    'application/x-zip-compressed': 'a ZIP',
    'image/png': 'a PNG',
    'image/jpeg': 'a JPG',
    'image/webp': 'a WebP',
    'image/gif': 'a GIF',
    'image/avif': 'an AVIF',
    'image/svg+xml': 'an SVG',
  }
  const named = friendly[file.type.toLowerCase()]
  if (named) return named

  const dot = file.name.lastIndexOf('.')
  if (dot > 0 && dot < file.name.length - 1) {
    const extension = file.name.slice(dot + 1).toUpperCase()
    return `${/^[AEIOU]/.test(extension) ? 'an' : 'a'} ${extension} file`
  }
  return file.type || 'this kind of file'
}

const matchesRule = (rule: UploadRule, file: { name: string; type: string }) => {
  // Either signal is enough, deliberately. The browser reports no `type` at all
  // for some files and an unhelpful `application/octet-stream` for others — a
  // ZIP especially — so requiring the MIME to match would reject files that are
  // exactly right. Accepting on the extension too costs nothing here: a PDF
  // dropped on the image zone fails BOTH tests, which is the mistake this is
  // for, and nothing legitimate is turned away.
  const mime = file.type.toLowerCase()
  if (mime && rule.mimes.some((allowed) => mime.startsWith(allowed))) return true
  const name = file.name.toLowerCase()
  return rule.extensions.some((extension) => name.endsWith(extension))
}

/**
 * Why this file cannot be uploaded here, or null when it can be.
 *
 * Size and type both, in one call, so every caller enforces both — and worded
 * for the person holding the file: what was wrong, what the limit is, and what
 * to do instead.
 */
export function rejectUpload(purpose: UploadPurpose, file: { name: string; type: string; size: number }): string | null {
  const rule = uploadRules[purpose]

  if (!matchesRule(rule, file)) {
    return `This drop zone takes ${rule.kinds}, not ${describeKind(file)}. Nothing was uploaded.`
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const size = formatBytes(file.size) ?? `${file.size} bytes`
    return `This file is ${size} and the most storage accepts is ${MAX_UPLOAD_LABEL}. Compress it or split it up — nothing was uploaded.`
  }

  // A zero-byte file uploads "successfully" and leaves a record pointing at
  // nothing a buyer can open, which is worse than a refusal.
  if (file.size === 0) return 'This file is empty (0 bytes). Nothing was uploaded.'

  return null
}
