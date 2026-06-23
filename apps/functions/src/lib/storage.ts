import { createServiceClient } from './supabase.ts'

export interface StorageProvider {
  getSignedUploadUrl: (key: string) => Promise<string>
  getSignedDownloadUrl: (key: string, ttlSeconds: number, downloadName?: string) => Promise<string>
  deleteObject: (key: string) => Promise<void>
}

const bucketName = () => {
  const bucket = process.env.STORAGE_BUCKET
  if (!bucket) throw new Error('STORAGE_BUCKET must be set.')
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
  }
}
