import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the secret key. Never expose this
 * key to the browser — these functions run in a trusted serverless context.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set.')
  }
  return createClient(url, secretKey, { auth: { persistSession: false } })
}
