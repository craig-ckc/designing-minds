import { badRequest, ok, unauthorized, type Handler } from '../lib/http.ts'
// import { createServiceClient } from '../lib/supabase.ts'

interface DownloadInput {
  customerId: string
  orderId: string
  fileId: string
}

function isDownloadInput(value: unknown): value is DownloadInput {
  const v = value as DownloadInput
  return typeof value === 'object' && value !== null && typeof v.customerId === 'string' && typeof v.orderId === 'string' && typeof v.fileId === 'string'
}

/**
 * Issue a short-lived signed URL for a purchased file. Downloads belong to the
 * Order Detail only (no standalone downloads area), and require:
 *  - the order to belong to the requesting customer, and
 *  - the order to be paid/fulfilled.
 *
 * WALL VERSION: sketches the entitlement check; real lookups and signed-URL
 * minting against Supabase Storage come later.
 */
export const issueDownload: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isDownloadInput(req.body)) return badRequest('Expected { customerId, orderId, fileId }.')

  const { orderId, fileId } = req.body

  // const supabase = createServiceClient()
  // TODO: load the order; confirm it belongs to customerId and is paid/fulfilled.
  const entitled = true // placeholder
  if (!entitled) return unauthorized('This file is not available on your account.')

  // TODO: mint a signed URL from Supabase Storage for the purchased file.
  return ok({ url: `https://storage.example/${orderId}/${fileId}?token=PLACEHOLDER`, expiresInSeconds: 300 })
}
