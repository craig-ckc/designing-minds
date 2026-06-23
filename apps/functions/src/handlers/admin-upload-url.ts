import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'
import { createSupabaseStorageProvider } from '../lib/storage.ts'

interface UploadUrlInput {
  productId: string
  fileId: string
  filename: string
}

const isUploadUrlInput = (value: unknown): value is UploadUrlInput => {
  const v = value as UploadUrlInput
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof v.productId === 'string' &&
    typeof v.fileId === 'string' &&
    typeof v.filename === 'string'
  )
}

const safeFilename = (filename: string) => filename.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const KEY_SEGMENT_RE = /^[a-zA-Z0-9._-]+$/

export const adminUploadUrl: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isUploadUrlInput(req.body)) return badRequest('Expected { productId, fileId, filename }.')
  if (!UUID_RE.test(req.body.productId)) return badRequest('Expected productId to be a UUID.')
  if (!KEY_SEGMENT_RE.test(req.body.fileId)) return badRequest('Expected fileId to be path-safe.')

  try {
    await requireAdmin(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Administrator access is required.')
  }

  try {
    const key = `products/${req.body.productId}/${req.body.fileId}-${safeFilename(req.body.filename)}`
    const storage = createSupabaseStorageProvider()
    const uploadUrl = await storage.getSignedUploadUrl(key)
    return ok({ uploadUrl, storageKey: key })
  } catch (error) {
    console.error('admin-upload-url failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to create upload URL.')
  }
}
