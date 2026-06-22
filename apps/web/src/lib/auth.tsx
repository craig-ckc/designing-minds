import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Customer } from '@designing-minds/cms'

/* Wireframe auth: a mock "signed-in" flag persisted in localStorage. When set,
   the session resolves to the demo customer. Real auth replaces this later. */

interface AuthValue {
  customer: Customer | null
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)
const KEY = 'designing-minds.web.signedIn'

export function AuthProvider({ demoCustomer, children }: { demoCustomer: Customer | null; children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(KEY) === 'true'
  })

  const login = useCallback(() => {
    setSignedIn(true)
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, 'true')
  }, [])

  const logout = useCallback(() => {
    setSignedIn(false)
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY)
  }, [])

  const customer = signedIn ? demoCustomer : null
  return <AuthContext.Provider value={{ customer, login, logout }}>{children}</AuthContext.Provider>
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
