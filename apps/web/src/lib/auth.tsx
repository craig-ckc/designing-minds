/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Customer } from '@designing-minds/cms'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { clearLocalCart, prepareCustomerCart } from './cart'
import { clearLocalPhysicalCart, prepareCustomerPhysicalCart } from './physical-cart'
import { createAuthActions, customerFromSession, loadSession, sameCustomer, type AuthActions } from './auth-client'

export type { AuthActions, SignUpResult } from './auth-client'

/* -------------------------------------------------------------------------
   Auth provider.

   Three contexts so consumers subscribe only to what they use:
     state    { customer, loading, authError }  re-renders on sign-in/out, not on token refresh
     actions  stable callbacks                    never re-renders its consumers
     session  the raw Supabase session            changes on every token refresh
   `useAuth()` stays as the combined convenience.
   ------------------------------------------------------------------------- */

export interface AuthState {
  customer: Customer | null
  loading: boolean
  /** Set when the stored session could not be read; the visitor is treated as signed out. */
  authError: string | null
}

export interface AuthRecovery {
  /** Read the stored session again after `authError`. */
  retrySession: () => void
}

const AuthStateContext = createContext<AuthState | null>(null)
const AuthActionsContext = createContext<(AuthActions & AuthRecovery) | null>(null)
const AuthSessionContext = createContext<Session | null | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Kept in state, not derived, so a token refresh (new session, same account) leaves its identity alone.
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState<string | null>(null)
  const stale = useRef(false)

  const applySession = useCallback((nextSession: Session | null, error: string | null = null) => {
    prepareCustomerCart(nextSession?.user.id ?? null)
    prepareCustomerPhysicalCart(nextSession?.user.id ?? null)
    setSession(nextSession)
    const next = customerFromSession(nextSession)
    setCustomer((current) => (sameCustomer(current, next) ? current : next))
    setAuthError(error)
    setLoading(false)
  }, [])

  const readSession = useCallback(() => {
    if (!supabase) return
    void loadSession(supabase.auth).then(({ session: stored, error }) => {
      if (!stale.current) applySession(stored, error)
    })
  }, [applySession])

  useEffect(() => {
    if (!supabase) return
    stale.current = false
    readSession()
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Drop the previous user's cart on sign-out so a different account signing
      // in next on this browser doesn't inherit it. Guard on the explicit event:
      // a null session on initial load is a guest, whose cart we must preserve.
      if (event === 'SIGNED_OUT') { clearLocalCart(); clearLocalPhysicalCart() }
      applySession(nextSession)
    })
    return () => {
      stale.current = true
      listener.subscription.unsubscribe()
    }
  }, [applySession, readSession])

  const retrySession = useCallback(() => {
    setLoading(true)
    setAuthError(null)
    readSession()
  }, [readSession])

  const actions = useMemo(() => ({
    ...createAuthActions(supabase?.auth ?? null, () => window.location.origin),
    retrySession,
  }), [retrySession])

  const state = useMemo<AuthState>(() => ({ customer, loading, authError }), [customer, loading, authError])

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={state}>
        <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  )
}

const need = <T,>(value: T | null | undefined, hook: string): T => {
  if (value === null || value === undefined) throw new Error(`${hook} must be used within an AuthProvider`)
  return value
}

/** Who is signed in. Does not re-render on token refresh. */
export const useAuthState = (): AuthState => need(useContext(AuthStateContext), 'useAuthState')

/** Sign-in, sign-up, sign-out and password actions. Stable: consumers never re-render for auth changes. */
export const useAuthActions = (): AuthActions & AuthRecovery => need(useContext(AuthActionsContext), 'useAuthActions')

/** The raw Supabase session (for the recovery link flow). Changes on every token refresh. */
export function useAuthSession(): Session | null {
  const session = useContext(AuthSessionContext)
  if (session === undefined) throw new Error('useAuthSession must be used within an AuthProvider')
  return session
}

export type AuthValue = AuthState & AuthActions & AuthRecovery & { session: Session | null }

/** State, actions and session together. Prefer the narrower hooks in new code. */
export function useAuth(): AuthValue {
  const state = useAuthState()
  const actions = useAuthActions()
  const session = useAuthSession()
  return useMemo(() => ({ ...state, ...actions, session }), [state, actions, session])
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
