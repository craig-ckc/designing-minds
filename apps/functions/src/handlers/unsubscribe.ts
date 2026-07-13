import { badRequest, ok, serverError, type Handler } from '../lib/http.ts'
import { unsubscribeContact, verifyUnsubscribeToken } from '../lib/mailchimp.ts'

/* -------------------------------------------------------------------------
   One-click unsubscribe.

   Backs the unsubscribe link in our confirmation email. The link carries the
   email plus a signed token; the web /unsubscribe page POSTs both here. We
   verify the token (so a link can't unsubscribe an arbitrary address) and set
   the contact's Mailchimp status to "unsubscribed".
   ------------------------------------------------------------------------- */

interface UnsubscribeInput {
  email: string
  token: string
}

const isUnsubscribeInput = (value: unknown): value is UnsubscribeInput =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as UnsubscribeInput).email === 'string' &&
  typeof (value as UnsubscribeInput).token === 'string'

export const unsubscribe: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isUnsubscribeInput(req.body)) return badRequest('Expected { email, token }.')

  const email = req.body.email.trim()
  const token = req.body.token.trim()

  // Verify the signed token before touching Mailchimp. A generic message avoids
  // revealing whether an address is on the list.
  let valid = false
  try {
    valid = verifyUnsubscribeToken(email, token)
  } catch (error) {
    console.error('unsubscribe token check failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to process the unsubscribe request.')
  }
  if (!valid) return badRequest('This unsubscribe link is invalid or has expired.')

  try {
    await unsubscribeContact(email)
    return ok({ unsubscribed: true })
  } catch (error) {
    console.error('unsubscribe failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to process the unsubscribe request.')
  }
}
