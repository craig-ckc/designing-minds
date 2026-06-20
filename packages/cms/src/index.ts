import { createSeedRepository } from './providers/seed'
import { createLocalRepository } from './providers/local'
import { createSupabaseRepository } from './providers/supabase'

export * from './types'
export * from './lib/formatters'
export { seedSnapshot } from './generated/seed'

interface RepositoryOptions {
  provider?: string
  app?: 'web' | 'admin'
  supabaseUrl?: string
  supabaseAnonKey?: string
}

export const createCmsRepository = ({
  provider,
  app = 'web',
  supabaseUrl,
  supabaseAnonKey,
}: RepositoryOptions = {}) => {
  if (provider === 'supabase' && supabaseUrl && supabaseAnonKey) {
    return createSupabaseRepository({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    })
  }

  if (provider === 'local') {
    return createLocalRepository()
  }

  if (app === 'admin') {
    return createLocalRepository()
  }

  return createSeedRepository()
}
