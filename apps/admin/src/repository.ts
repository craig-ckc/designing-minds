import { createCmsRepository } from '@designing-minds/cms'

export const repository = createCmsRepository({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
})
