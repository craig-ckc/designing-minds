import { createCmsRepository } from '@designing-minds/cms'
import { supabase } from './lib/supabase'

export const repository = createCmsRepository({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  supabaseClient: supabase ?? undefined,
})
