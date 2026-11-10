import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, ok, serverError, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'
import { adminAuthFailure } from '../lib/auth-errors.ts'
import { createSupabaseStorageProvider } from '../lib/storage.ts'

/**
 * Reserve a storage key for an admin upload and hand back a signed PUT URL.
 *
 * `purpose` decides which bucket, and they are not interchangeable:
 *   'purchased' → the private bucket. Paid content; a buyer only ever reaches it
 *                 through issue-download, after an entitlement check.
 *   'gallery'   → the public media bucket. Preview images for the Product
 *                 Detail, so the response also carries the permanent public URL
 *                 the record stores and the prerendered HTML references.
 *   'preview'   → the public media bucket too, under its own `previews/`
 *                 prefix. Free, publicly downloadable PDF previews — same
 *                 public-URL response as 'gallery', just a different key and
 *                 different content.
 *
 * It defaults to 'purchased' so an older admin build, which sends no purpose at
 * all, keeps behaving exactly as it did.
 */
interface UploadUrlInput {
  /** Owning record's id. `productId` is accepted as the historical name. */
  recordId?: string
  productId?: string
  fileId: string
  filename: string
  purpose?: 'purchased' | 'gallery' | 'preview'
  /** Optional declared MIME type and size; validated when present. */
  contentType?: string
  sizeBytes?: number
}

const isUploadUrlInput = (value: unknown): value is UploadUrlInput => {
  const v = value as UploadUrlInput
  if (typeof value !== 'object' || value === null) return false
  if (typeof v.fileId !== 'string' || typeof v.filename !== 'string') return false
  if (typeof v.recordId !== 'string' && typeof v.productId !== 'string') return false
  if (v.contentType !== undefined && typeof v.contentType !== 'string') return false
  if (v.sizeBytes !== undefined && (typeof v.sizeBytes !== 'number' || !Number.isFinite(v.sizeBytes))) return false
  return v.purpose === undefined || v.purpose === 'purchased' || v.purpose === 'gallery' || v.purpose === 'preview'
}

/*
 * What each bucket may receive, enforced here because the admin's own checks
 * (apps/admin/src/lib/upload-rules.ts) are a convenience, not a boundary: any
 * admin session can call this endpoint directly. Mirrors those rules.
 *
 * It matters most for the PUBLIC bucket: an HTML or SVG object stored there is
 * served from the storage domain, so only raster images (gallery) and PDFs
 * (previews) are allowed. The private bucket takes PDFs and ZIPs.
 */
type Purpose = NonNullable<UploadUrlInput['purpose']>
const UPLOAD_RULES: Record<Purpose, { extensions: string[]; mimes: string[]; kinds: string }> = {
  purchased: { extensions: ['.pdf', '.zip'], mimes: ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/octet-stream'], kinds: 'PDF or ZIP' },
  gallery: { extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'], mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'], kinds: 'PNG, JPG, WebP, GIF or AVIF' },
  preview: { extensions: ['.pdf'], mimes: ['application/pdf'], kinds: 'PDF' },
}
/** The Supabase project-wide upload ceiling (50 MiB); storage enforces it regardless. */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const rejectUpload = (purpose: Purpose, name: string, contentType: string | undefined, sizeBytes: number | undefined): string | null => {
  const rule = UPLOAD_RULES[purpose]
  if (!rule.extensions.some((extension) => name.toLowerCase().endsWith(extension))) return `This upload only takes ${rule.kinds} files.`
  if (contentType && !rule.mimes.includes(contentType.toLowerCase().split(';')[0]?.trim() ?? '')) return `This upload only takes ${rule.kinds} files.`
  if (sizeBytes !== undefined && (sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES)) return 'This file is empty or larger than the 50 MB storage limit.'
  return null
}

const safeFilename = (filename: string) => filename.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const KEY_SEGMENT_RE = /^[a-zA-Z0-9._-]+$/

export const adminUploadUrl: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isUploadUrlInput(req.body)) return badRequest('Expected { recordId, fileId, filename, purpose? }.')

  // Both bucket paths interpolate these straight into an object key, so they are
  // validated before either branch — not per branch, where a new one could be
  // added later without them.
  const recordId = req.body.recordId ?? req.body.productId ?? ''
  if (!UUID_RE.test(recordId)) return badRequest('Expected recordId to be a UUID.')
  if (!KEY_SEGMENT_RE.test(req.body.fileId)) return badRequest('Expected fileId to be path-safe.')

  try {
    await requireAdmin(req.headers)
  } catch (error) {
    return adminAuthFailure(error)
  }

  const purpose: Purpose = req.body.purpose ?? 'purchased'
  const name = safeFilename(req.body.filename)
  const rejection = rejectUpload(purpose, name, req.body.contentType, req.body.sizeBytes)
  if (rejection) return badRequest(rejection)

  try {
    const storage = createSupabaseStorageProvider()

    if (req.body.purpose === 'gallery' || req.body.purpose === 'preview') {
      const prefix = req.body.purpose === 'gallery' ? 'gallery' : 'previews'
      const key = `${prefix}/${recordId}/${req.body.fileId}-${name}`
      const { uploadUrl, publicUrl } = await storage.getPublicSignedUploadUrl(key)
      return ok({ uploadUrl, storageKey: key, publicUrl })
    }

    const key = `products/${recordId}/${req.body.fileId}-${name}`
    const uploadUrl = await storage.getSignedUploadUrl(key)
    return ok({ uploadUrl, storageKey: key })
  } catch (error) {
    // The cause (a missing bucket, a rejected service key) goes to the function
    // logs, not the response: provider error text can name buckets and hosts,
    // and an admin session is still only a session.
    console.error('[admin-upload-url] reservation failed:', error instanceof Error ? error.message : String(error))
    logEvent('admin.upload.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to reserve storage for this file. Check the function logs for the cause.')
  }
}
