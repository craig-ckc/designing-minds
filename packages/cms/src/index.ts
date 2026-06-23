import { createSupabaseRepository } from './providers/supabase'

export * from './types'
export * from './lib/formatters'

interface RepositoryOptions {
  supabaseUrl?: string
  supabaseAnonKey?: string
}

export const createCmsRepository = ({
  supabaseUrl,
  supabaseAnonKey,
}: RepositoryOptions = {}) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.')
  }

  return createSupabaseRepository({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  })
}
