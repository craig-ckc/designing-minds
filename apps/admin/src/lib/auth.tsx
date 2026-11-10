/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AdminAuthValue {
  session: Session | null
  loading: boolean
  isAdmin: boolean
  roleError: string | null
  retryRole: () => Promise<void>
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
  const [roleError, setRoleError] = useState<string | null>(null)
  const [recovery, setRecovery] = useState(false)
  const roleRequest = useRef(0)
  const mounted = useRef(false)
  const currentSession = useRef<Session | null>(null)
  const invalidateRoleRequests = useCallback(() => {
    roleRequest.current += 1
  }, [])

  const loadRole = useCallback(async (nextSession: Session | null) => {
    const request = ++roleRequest.current
    const sameUser = Boolean(currentSession.current && nextSession && currentSession.current.user.id === nextSession.user.id)
    currentSession.current = nextSession
    setSession(nextSession)
    setRoleError(null)
    if (!sameUser) {
      setIsAdmin(false)
      setLoading(true)
    }
    if (!nextSession) {
      if (mounted.current && request === roleRequest.current) setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase.from('user_roles').select('role').eq('userId', nextSession.user.id).maybeSingle()
      if (!mounted.current || request !== roleRequest.current) return
      setIsAdmin(!error && data?.role === 'admin')
      if (error) setRoleError(error.message)
    } catch (error) {
      if (!mounted.current || request !== roleRequest.current) return
      setIsAdmin(false)
      setRoleError(error instanceof Error ? error.message : 'Could not check administrator access.')
    } finally {
      if (mounted.current && request === roleRequest.current) setLoading(false)
    }
  }, [])

  const retryRole = useCallback(async () => {
    await loadRole(session)
  }, [loadRole, session])

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    let authEventObserved = false
    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled || authEventObserved) return
      if (error) {
        ++roleRequest.current
        setSession(null)
        setIsAdmin(false)
        setRoleError(error.message)
        setLoading(false)
        return
      }
      void loadRole(data.session)
    }).catch((error: unknown) => {
      if (cancelled || authEventObserved) return
      ++roleRequest.current
      setSession(null)
      setIsAdmin(false)
      setRoleError(error instanceof Error ? error.message : 'Could not check your sign-in session.')
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authEventObserved = true
      // A reset-link arrival fires PASSWORD_RECOVERY with a temporary session.
      // Flag it so the app shows the reset screen instead of the workspace.
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
      void loadRole(nextSession)
    })
    return () => {
      cancelled = true
      mounted.current = false
      invalidateRoleRequests()
      listener.subscription.unsubscribe()
    }
  }, [invalidateRoleRequests, loadRole])

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
    () => ({ session, loading, isAdmin, roleError, retryRole, recovery, signIn, logout, resetPassword, updatePassword }),
    [isAdmin, loading, logout, recovery, resetPassword, roleError, retryRole, session, signIn, updatePassword],
  )
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
