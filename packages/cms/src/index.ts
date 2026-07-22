import { createSupabaseRepository } from './providers/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export * from './types'
export * from './lib/formatters'
export * from './lib/entitlements'
export * from './lib/public-snapshot'

interface RepositoryOptions {
  supabaseUrl?: string
  supabasePublishableKey?: string
  supabaseClient?: SupabaseClient
  audience?: 'public' | 'admin'
}

export const createCmsRepository = ({
  supabaseUrl,
  supabasePublishableKey,
  supabaseClient,
  audience = 'public',
}: RepositoryOptions = {}) => {
  if (!supabaseClient && (!supabaseUrl || !supabasePublishableKey)) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.')
  }

  return createSupabaseRepository({
    url: supabaseUrl ?? '',
    publishableKey: supabasePublishableKey ?? '',
    client: supabaseClient,
    audience,
  })
}
