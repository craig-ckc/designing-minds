import type { User } from '@supabase/supabase-js'
import { createServiceClient } from './supabase.ts'

export const bearerTokenFrom = (headers: Record<string, string | undefined>): string | null => {
  const header = headers.authorization ?? headers.Authorization
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match?.[1] ?? null
}

export const requireUser = async (headers: Record<string, string | undefined>): Promise<User> => {
  const token = bearerTokenFrom(headers)
  if (!token) throw new Error('Missing bearer token.')

  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('Invalid bearer token.')
  return data.user
}

export const requireAdmin = async (headers: Record<string, string | undefined>): Promise<User> => {
  const user = await requireUser(headers)
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('user_roles').select('role').eq('userId', user.id).maybeSingle()
  if (error) throw new Error(error.message)
  if (data?.role !== 'admin') throw new Error('Administrator access is required.')
  return user
}
