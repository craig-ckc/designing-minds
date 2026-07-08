/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AdminAuthValue {
  session: Session | null
  loading: boolean
  isAdmin: boolean
  /** True after arriving via a password-reset link, until the password is set. */
  recovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Send a password-reset email that links back to the admin app. */
  resetPassword: (email: string) => Promise<void>
  /** Set a new password for the recovery session established by the email link. */
  updatePassword: (password: string) => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [recovery, setRecovery] = useState(false)

  const loadRole = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession)
    if (!nextSession) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    const { data, error } = await supabase.from('user_roles').select('role').eq('userId', nextSession.user.id).maybeSingle()
    setIsAdmin(!error && data?.role === 'admin')
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) void loadRole(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // A reset-link arrival fires PASSWORD_RECOVERY with a temporary session.
      // Flag it so the app shows the reset screen instead of the workspace.
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      void loadRole(nextSession)
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [loadRole])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) throw new Error(error.message)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(error.message)
    setRecovery(false)
  }, [])

  const value = useMemo(
    () => ({ session, loading, isAdmin, recovery, signIn, logout, resetPassword, updatePassword }),
    [isAdmin, loading, logout, recovery, resetPassword, session, signIn, updatePassword],
  )
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
