import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: { url: string; secretKey: string; client: SupabaseClient } | undefined

/**
 * Server-side Supabase client using the secret key. Never expose this
 * key to the browser — these functions run in a trusted serverless context.
 *
 * One client is shared per process (a warm serverless instance serves many
 * requests): it holds no session (`persistSession: false`) and no per-request
 * state, so reuse is safe and saves a client, and its connection setup, per
 * call. A changed URL or key (tests, rotated env) builds a fresh one.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set.')
  }
  if (cached && cached.url === url && cached.secretKey === secretKey) return cached.client
  const client = createClient(url, secretKey, { auth: { persistSession: false } })
  cached = { url, secretKey, client }
  return client
}
