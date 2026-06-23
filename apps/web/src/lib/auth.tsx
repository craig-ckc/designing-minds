/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Customer } from '@designing-minds/cms'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthValue {
  customer: Customer | null
  session: Session | null
  loading: boolean
  isVerified: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthValue | null>(null)

const customerFromSession = (session: Session | null): Customer | null => {
  const user = session?.user
  if (!user?.email) return null
  return {
    id: user.id,
    name: String(user.user_metadata.name ?? user.user_metadata.full_name ?? user.email.split('@')[0]),
    email: user.email,
    createdAt: user.created_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session)
        setLoading(false)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    })
    if (error) throw new Error(error.message)
  }, [])

  const logout = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }, [])

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(error.message)
    return data.session?.access_token ?? null
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      customer: customerFromSession(session),
      session,
      loading,
      isVerified: Boolean(session?.user.email_confirmed_at),
      signIn,
      signUp,
      logout,
      getAccessToken,
    }),
    [getAccessToken, loading, logout, session, signIn, signUp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

/** Up to two uppercase initials from a name, e.g. "Amoré van Wyk" -> "AV". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
