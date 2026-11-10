import type { Customer } from '@designing-minds/cms'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { resolvePasswordResetRedirectUrl } from '../site-url'

/* -------------------------------------------------------------------------
   Auth operations, independent of React and of the Supabase singleton.

   The provider in auth.tsx supplies the real client; tests supply a fake with
   the same surface. Keeping this free of `import.meta.env` is what makes it
   testable in plain Node.
   ------------------------------------------------------------------------- */

export type AuthApi = Pick<SupabaseClient['auth'], 'getSession' | 'signInWithPassword' | 'signUp' | 'signOut' | 'resetPasswordForEmail' | 'updateUser'>

export const customerFromSession = (session: Session | null): Customer | null => {
  const user = session?.user
  if (!user?.email) return null
  return {
    id: user.id,
    name: String(user.user_metadata.name ?? user.user_metadata.full_name ?? user.email.split('@')[0]),
    email: user.email,
    createdAt: user.created_at,
  }
}

/** Two customers describing the same account, so identity can be kept across token refreshes. */
export const sameCustomer = (a: Customer | null, b: Customer | null): boolean =>
  a === b || Boolean(a && b && a.id === b.id && a.name === b.name && a.email === b.email && a.createdAt === b.createdAt)

export interface SignUpResult {
  /** True when Supabase created the account but sent a confirmation email instead of a session. */
  needsConfirmation: boolean
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  /** Send a password-reset email that links back to /reset-password. */
  resetPassword: (email: string) => Promise<void>
  /** Set a new password for the recovery session established by the email link. */
  updatePassword: (password: string) => Promise<void>
}

const NOT_CONFIGURED = 'Supabase is not configured.'

export function createAuthActions(auth: AuthApi | null, origin: () => string | undefined): AuthActions {
  return {
    async signIn(email, password) {
      if (!auth) throw new Error(NOT_CONFIGURED)
      const { error } = await auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
    },
    async signUp(name, email, password) {
      if (!auth) throw new Error(NOT_CONFIGURED)
      const { data, error } = await auth.signUp({ email, password, options: { data: { name } } })
      if (error) throw new Error(error.message)
      // With email confirmation on, Supabase answers with a user but no session.
      return { needsConfirmation: !data.session }
    },
    async logout() {
      if (!auth) return
      const { error } = await auth.signOut()
      if (error) throw new Error(error.message)
    },
    async getAccessToken() {
      if (!auth) return null
      const { data, error } = await auth.getSession()
      if (error) throw new Error(error.message)
      return data.session?.access_token ?? null
    },
    async resetPassword(email) {
      if (!auth) throw new Error(NOT_CONFIGURED)
      const { error } = await auth.resetPasswordForEmail(email, { redirectTo: resolvePasswordResetRedirectUrl(origin()) })
      if (error) throw new Error(error.message)
    },
    async updatePassword(password) {
      if (!auth) throw new Error(NOT_CONFIGURED)
      const { error } = await auth.updateUser({ password })
      if (error) throw new Error(error.message)
    },
  }
}

export interface SessionResult {
  session: Session | null
  /** Why the stored session could not be read; null when it could (even if signed out). */
  error: string | null
}

export const SESSION_TIMEOUT_MS = 10_000
const SESSION_UNAVAILABLE = 'We could not check whether you are signed in. Check your connection and try again.'

/**
 * Read the stored session. Never rejects and never hangs: a failure or a
 * stalled request resolves to signed-out with an `error`, so `loading` always ends.
 */
export function loadSession(auth: Pick<AuthApi, 'getSession'>, timeoutMs = SESSION_TIMEOUT_MS): Promise<SessionResult> {
  return new Promise<SessionResult>((resolve) => {
    const timer = setTimeout(() => resolve({ session: null, error: SESSION_UNAVAILABLE }), timeoutMs)
    const settle = (result: SessionResult) => {
      clearTimeout(timer)
      resolve(result)
    }
    auth.getSession().then(
      ({ data, error }) => settle(error ? { session: null, error: SESSION_UNAVAILABLE } : { session: data.session, error: null }),
      () => settle({ session: null, error: SESSION_UNAVAILABLE }),
    )
  })
}
