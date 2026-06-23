import { createSupabaseRepository } from './providers/supabase'

export * from './types'
export * from './lib/formatters'

interface RepositoryOptions {
  supabaseUrl?: string
  supabasePublishableKey?: string
  audience?: 'public' | 'admin'
}

export const createCmsRepository = ({
  supabaseUrl,
  supabasePublishableKey,
  audience = 'public',
}: RepositoryOptions = {}) => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.')
  }

  return createSupabaseRepository({
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    audience,
  })
}
