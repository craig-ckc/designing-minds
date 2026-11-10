import { forbidden, serverError, unauthorized, type HandlerResponse } from './http.ts'

/** The caller presented no usable credential (missing or invalid token): HTTP 401. */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/** The caller is signed in but lacks the role the endpoint needs: HTTP 403. */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Maps a requireAdmin() failure onto the right response. Only the two auth
 * errors above carry a caller-safe message; anything else (a database or
 * configuration fault while checking the role) is a server problem and its
 * detail stays in the logs.
 */
export const adminAuthFailure = (error: unknown): HandlerResponse => {
  if (error instanceof ForbiddenError) return forbidden(error.message)
  if (error instanceof AuthenticationError) return unauthorized(error.message)
  return serverError('Unable to verify administrator access.')
}
