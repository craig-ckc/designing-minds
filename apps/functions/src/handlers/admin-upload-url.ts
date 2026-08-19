import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'
import { createSupabaseStorageProvider } from '../lib/storage.ts'

/**
 * Reserve a storage key for an admin upload and hand back a signed PUT URL.
 *
 * `purpose` decides which bucket, and the two are not interchangeable:
 *   'purchased' → the private bucket. Paid content; a buyer only ever reaches it
 *                 through issue-download, after an entitlement check.
 *   'gallery'   → the public media bucket. Preview images for the Product
 *                 Detail, so the response also carries the permanent public URL
 *                 the record stores and the prerendered HTML references.
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
  purpose?: 'purchased' | 'gallery'
}

const isUploadUrlInput = (value: unknown): value is UploadUrlInput => {
  const v = value as UploadUrlInput
  if (typeof value !== 'object' || value === null) return false
  if (typeof v.fileId !== 'string' || typeof v.filename !== 'string') return false
  if (typeof v.recordId !== 'string' && typeof v.productId !== 'string') return false
  return v.purpose === undefined || v.purpose === 'purchased' || v.purpose === 'gallery'
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
    return unauthorized(error instanceof Error ? error.message : 'Administrator access is required.')
  }

  try {
    const storage = createSupabaseStorageProvider()
    const name = safeFilename(req.body.filename)

    if (req.body.purpose === 'gallery') {
      const key = `gallery/${recordId}/${req.body.fileId}-${name}`
      const { uploadUrl, publicUrl } = await storage.getPublicSignedUploadUrl(key)
      return ok({ uploadUrl, storageKey: key, publicUrl })
    }

    const key = `products/${recordId}/${req.body.fileId}-${name}`
    const uploadUrl = await storage.getSignedUploadUrl(key)
    return ok({ uploadUrl, storageKey: key })
  } catch (error) {
    console.error('admin-upload-url failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to create upload URL.')
  }
}
