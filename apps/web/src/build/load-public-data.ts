import { createCmsRepository, toPublicSnapshot, type CmsSnapshot, type SlugRedirect } from '@designing-minds/cms'
import type { SupabaseClient } from '@supabase/supabase-js'

/* -------------------------------------------------------------------------
   Build-time data fetch.

   Compiled into the SSR bundle so the (plain JS) prerender script can call it
   without running TypeScript itself. Fetches the full snapshot through the
   PUBLIC Supabase client (RLS-restricted; operational rows come back empty),
   then sanitizes to a public snapshot, and reads system-managed redirects.
   ------------------------------------------------------------------------- */

export interface PublicBuildData {
  snapshot: CmsSnapshot
  redirects: SlugRedirect[]
}

export interface LoadOptions {
  supabaseUrl?: string
  supabasePublishableKey?: string
  /** Development reuses the browser auth client instead of opening another session manager. */
  supabaseClient?: SupabaseClient
}

export async function loadPublicBuildData({ supabaseUrl, supabasePublishableKey, supabaseClient }: LoadOptions): Promise<PublicBuildData> {
  const repository = createCmsRepository({ supabaseUrl, supabasePublishableKey, supabaseClient, audience: 'public' })
  const [full, redirects] = await Promise.all([repository.getSnapshot(), repository.getSlugRedirects()])
  return { snapshot: toPublicSnapshot(full), redirects }
}
