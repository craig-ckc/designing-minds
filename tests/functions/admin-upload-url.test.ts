import { beforeEach, describe, expect, it, vi } from 'vitest'

/* The handler builds its storage provider from the module, so the module is
   mocked rather than the network — these tests are about WHICH bucket a request
   lands in, which is the security boundary between paid and public content. */
const publicUpload = vi.fn(async (key: string) => ({
  uploadUrl: `https://storage.test/public/${key}?signed`,
  publicUrl: `https://storage.test/object/public/public-media/${key}`,
}))
const privateUpload = vi.fn(async (key: string) => `https://storage.test/private/${key}?signed`)

vi.mock('../../apps/functions/src/lib/storage.ts', () => ({
  createSupabaseStorageProvider: () => ({
    getSignedUploadUrl: privateUpload,
    getPublicSignedUploadUrl: publicUpload,
    getSignedDownloadUrl: vi.fn(),
    deleteObject: vi.fn(),
  }),
}))

import { AuthenticationError, ForbiddenError } from '../../apps/functions/src/lib/auth-errors.ts'
const requireAdmin = vi.fn(async () => undefined)
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireAdmin: () => requireAdmin() }))

const { adminUploadUrl } = await import('../../apps/functions/src/handlers/admin-upload-url.ts')

const RECORD = '3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b'
const FILE = 'a1b2c3d4'

const post = (body: unknown, headers: Record<string, string> = { authorization: 'Bearer token' }) =>
  adminUploadUrl({ method: 'POST', headers, body } as Parameters<typeof adminUploadUrl>[0])

describe('POST /api/admin/upload-url', () => {
  beforeEach(() => {
    publicUpload.mockClear()
    privateUpload.mockClear()
    requireAdmin.mockClear()
    requireAdmin.mockImplementation(async () => undefined)
  })

  it('sends gallery images to the public bucket and returns their permanent URL', async () => {
    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'front page.JPG', purpose: 'gallery' })

    expect(response.status).toBe(200)
    expect(privateUpload).not.toHaveBeenCalled()
    // Namespaced by record, and the filename is sanitised into the key.
    expect(publicUpload).toHaveBeenCalledWith(`gallery/${RECORD}/${FILE}-front-page.JPG`)
    // The website prerenders, so it needs a URL that keeps working with nothing
    // to sign — without this the record would store an unrenderable image.
    expect(response.body).toMatchObject({ publicUrl: expect.stringContaining('/public/') })
  })

  it('sends preview PDFs to the public bucket under their own prefix and returns a permanent URL', async () => {
    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'grade4 sample.pdf', purpose: 'preview' })

    expect(response.status).toBe(200)
    expect(privateUpload).not.toHaveBeenCalled()
    // Same public bucket as gallery images, but its own prefix — the two must
    // never collide, since gallery images and preview PDFs are different content.
    expect(publicUpload).toHaveBeenCalledWith(`previews/${RECORD}/${FILE}-grade4-sample.pdf`)
    // A preview PDF is a free download, prerendered into static HTML just like a
    // gallery image — it needs the same kind of URL that keeps working unsigned.
    expect(response.body).toMatchObject({ publicUrl: expect.stringContaining('/public/') })
  })

  it('keeps purchased files in the private bucket and hands out no public URL', async () => {
    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'grade4.pdf', purpose: 'purchased' })

    expect(response.status).toBe(200)
    expect(publicUpload).not.toHaveBeenCalled()
    expect(privateUpload).toHaveBeenCalledWith(`products/${RECORD}/${FILE}-grade4.pdf`)
    expect(response.body).not.toHaveProperty('publicUrl')
  })

  it('defaults to the private bucket when no purpose is given', async () => {
    // An admin deployed ahead of this function sends no purpose at all. The safe
    // default is the bucket that was already in use, never the public one.
    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'legacy.pdf' })

    expect(response.status).toBe(200)
    expect(publicUpload).not.toHaveBeenCalled()
    expect(privateUpload).toHaveBeenCalledOnce()
  })

  it('still accepts the historical productId field name', async () => {
    // web and admin deploy separately, so one can be a version behind the other.
    const response = await post({ productId: RECORD, fileId: FILE, filename: 'legacy.pdf' })

    expect(response.status).toBe(200)
    expect(privateUpload).toHaveBeenCalledWith(`products/${RECORD}/${FILE}-legacy.pdf`)
  })

  it('validates the key segments before either bucket is touched', async () => {
    // Both branches interpolate these straight into an object key.
    const notUuid = await post({ recordId: 'not-a-uuid', fileId: FILE, filename: 'x.jpg', purpose: 'gallery' })
    expect(notUuid.status).toBe(400)

    const traversal = await post({ recordId: RECORD, fileId: '../../etc', filename: 'x.jpg', purpose: 'gallery' })
    expect(traversal.status).toBe(400)

    const badPurpose = await post({ recordId: RECORD, fileId: FILE, filename: 'x.jpg', purpose: 'anything' })
    expect(badPurpose.status).toBe(400)

    expect(publicUpload).not.toHaveBeenCalled()
    expect(privateUpload).not.toHaveBeenCalled()
  })

  it('refuses a gallery upload from a signed-in caller who is not an administrator with 403', async () => {
    requireAdmin.mockImplementation(async () => {
      throw new ForbiddenError('Administrator access is required.')
    })

    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'x.jpg', purpose: 'gallery' })

    expect(response.status).toBe(403)
    expect(publicUpload).not.toHaveBeenCalled()
  })

  it('refuses an unauthenticated caller with 401', async () => {
    requireAdmin.mockImplementation(async () => {
      throw new AuthenticationError('Missing bearer token.')
    })

    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'x.jpg', purpose: 'gallery' }, {})

    expect(response.status).toBe(401)
    expect(publicUpload).not.toHaveBeenCalled()
  })

  it.each([
    ['gallery', 'page.html'],
    ['gallery', 'logo.svg'],
    ['gallery', 'photo.pdf'],
    ['preview', 'sample.png'],
    ['preview', 'page.html'],
    ['purchased', 'run.exe'],
    ['purchased', 'notes.txt'],
  ] as const)('rejects a %s upload named %s before reserving any storage', async (purpose, filename) => {
    const response = await post({ recordId: RECORD, fileId: FILE, filename, purpose })
    expect(response.status).toBe(400)
    expect(publicUpload).not.toHaveBeenCalled()
    expect(privateUpload).not.toHaveBeenCalled()
  })

  it('judges the file by its final extension, not by a harmless-looking one earlier in the name', async () => {
    expect((await post({ recordId: RECORD, fileId: FILE, filename: 'cover.png.html', purpose: 'gallery' })).status).toBe(400)
    expect((await post({ recordId: RECORD, fileId: FILE, filename: 'cover.html.png', purpose: 'gallery' })).status).toBe(200)
  })

  it.each([
    ['gallery', 'a.png', 'image/svg+xml'],
    ['gallery', 'a.png', 'text/html'],
    ['preview', 'a.pdf', 'image/png'],
  ] as const)('rejects a declared content type that does not belong in a %s upload (%s as %s)', async (purpose, filename, contentType) => {
    expect((await post({ recordId: RECORD, fileId: FILE, filename, purpose, contentType })).status).toBe(400)
    expect(publicUpload).not.toHaveBeenCalled()
  })

  it('rejects a declared size that is empty or above the 50 MB storage limit, and accepts the limit itself', async () => {
    const base = { recordId: RECORD, fileId: FILE, filename: 'a.pdf', purpose: 'purchased' as const }
    expect((await post({ ...base, sizeBytes: 0 })).status).toBe(400)
    expect((await post({ ...base, sizeBytes: 50 * 1024 * 1024 + 1 })).status).toBe(400)
    expect((await post({ ...base, sizeBytes: 50 * 1024 * 1024 })).status).toBe(200)
  })

  it('accepts the types the admin offers for each zone', async () => {
    for (const [purpose, filename, contentType] of [
      ['gallery', 'a.webp', 'image/webp'],
      ['gallery', 'a.JPEG', 'image/jpeg'],
      ['preview', 'a.pdf', 'application/pdf'],
      ['purchased', 'a.zip', 'application/x-zip-compressed'],
      ['purchased', 'a.pdf', 'application/pdf'],
    ] as const) {
      expect((await post({ recordId: RECORD, fileId: FILE, filename, purpose, contentType })).status).toBe(200)
    }
  })

  it('keeps provider error detail out of the response', async () => {
    privateUpload.mockRejectedValueOnce(new Error('Bucket "secret-private-bucket" not found at https://internal.host'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await post({ recordId: RECORD, fileId: FILE, filename: 'a.pdf' })
    spy.mockRestore()
    expect(response.status).toBe(500)
    expect(JSON.stringify(response.body)).not.toContain('secret-private-bucket')
  })
})
