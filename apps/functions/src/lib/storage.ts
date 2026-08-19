import { createServiceClient } from './supabase.ts'

/**
 * Two buckets, because the objects have opposite audiences.
 *
 * STORAGE_BUCKET is private: purchased files. Nothing reaches them without a
 * signed URL minted after an entitlement check (see issue-download).
 *
 * PUBLIC_MEDIA_BUCKET is public: gallery images an editor publishes on a
 * Product Detail. The website prerenders to static HTML, so there is no request
 * in which to sign anything — the object needs a URL that simply keeps working.
 *
 * They are separate buckets rather than two prefixes in one so that the public
 * read path cannot be widened onto paid content by a policy mistake.
 */
export interface StorageProvider {
  getSignedUploadUrl: (key: string) => Promise<string>
  getSignedDownloadUrl: (key: string, ttlSeconds: number, downloadName?: string) => Promise<string>
  deleteObject: (key: string) => Promise<void>
  /** Reserve a key in the PUBLIC bucket, for content served straight to visitors. */
  getPublicSignedUploadUrl: (key: string) => Promise<{ uploadUrl: string; publicUrl: string }>
}

const bucketName = () => {
  const bucket = process.env.STORAGE_BUCKET
  if (!bucket) throw new Error('STORAGE_BUCKET must be set.')
  return bucket
}

/* Named apart from bucketName() so a missing public bucket can never silently
   fall back to the private one — that would publish paid content. */
const publicBucketName = () => {
  const bucket = process.env.PUBLIC_MEDIA_BUCKET
  if (!bucket) throw new Error('PUBLIC_MEDIA_BUCKET must be set.')
  return bucket
}

export const createSupabaseStorageProvider = (): StorageProvider => {
  const supabase = createServiceClient()
  const bucket = bucketName()

  return {
    async getSignedUploadUrl(key) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key)
      if (error) throw new Error(error.message)
      return data.signedUrl
    },
    async getSignedDownloadUrl(key, ttlSeconds, downloadName) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, ttlSeconds, downloadName ? { download: downloadName } : undefined)
      if (error) throw new Error(error.message)
      return data.signedUrl
    },
    async deleteObject(key) {
      const { error } = await supabase.storage.from(bucket).remove([key])
      if (error) throw new Error(error.message)
    },

    /* Resolved per call rather than at construction, so a deployment missing
       PUBLIC_MEDIA_BUCKET still serves downloads instead of failing to boot the
       provider outright. */
    async getPublicSignedUploadUrl(key) {
      const publicBucket = publicBucketName()
      const { data, error } = await supabase.storage.from(publicBucket).createSignedUploadUrl(key)
      if (error) throw new Error(error.message)
      // Taken from the client rather than assembled by hand, so the URL follows
      // whatever host and path scheme this project's storage actually uses.
      const { data: published } = supabase.storage.from(publicBucket).getPublicUrl(key)
      if (!published?.publicUrl) throw new Error('Unable to resolve the public URL for the uploaded image.')
      return { uploadUrl: data.signedUrl, publicUrl: published.publicUrl }
    },
  }
}
