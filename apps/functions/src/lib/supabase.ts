import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the service-role key. Never expose this
 * key to the browser — these functions run in a trusted serverless context.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}
