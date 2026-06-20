import { createCmsRepository } from '@designing-minds/cms'

export const repository = createCmsRepository({
  app: 'web',
  provider: import.meta.env.VITE_CMS_PROVIDER,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})
