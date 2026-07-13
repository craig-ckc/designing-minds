import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/* -------------------------------------------------------------------------
   Mailchimp audience sync.

   Upserts a contact into a Mailchimp audience when a public form is submitted
   — adds a new contact or updates an existing one via the Marketing API's
   "add or update list member" endpoint (PUT .../members/{subscriber_hash}).

   Like the Resend integration, this is gated on configuration and best-effort:
   if the Mailchimp env vars are absent the sync is skipped with a warning
   rather than throwing, and callers treat a failure as non-fatal (the form
   submission is already persisted in Postgres). It throws only on a real
   Mailchimp API error so the caller can log it.

   To go live, set on the functions project:
     MAILCHIMP_API_KEY      — API key (its "-usX" suffix selects the datacenter)
     MAILCHIMP_AUDIENCE_ID  — audience (list) ID to sync submitters into
   ------------------------------------------------------------------------- */

export type MailchimpStatus = 'subscribed' | 'pending' | 'unsubscribed' | 'cleaned' | 'transactional'

export interface MailchimpContact {
  /** The contact's email address. */
  email: string
  firstName?: string
  lastName?: string
  /**
   * Status applied only when the contact is NEW (maps to Mailchimp's
   * `status_if_new`). Existing contacts keep their current subscription status,
   * so an update never silently re-subscribes someone who opted out. Defaults
   * to "subscribed". Use "pending" for double opt-in (Mailchimp emails a
   * confirmation link before the contact is subscribed).
   */
  statusIfNew?: MailchimpStatus
  /** Tags to apply (e.g. which form the contact came from). */
  tags?: string[]
}

/**
 * Mailchimp's subscriber hash: the MD5 of the lowercased email address. It is
 * both the member id in the URL and how the API upserts by email.
 */
export const subscriberHash = (email: string): string =>
  createHash('md5').update(email.trim().toLowerCase()).digest('hex')

/**
 * The datacenter prefix is the suffix after the last "-" in the API key
 * (e.g. `abc123...-us5` → `us5`); it selects the API host. Returns null when
 * the key has no suffix, so callers can fail loudly on a malformed key.
 */
export const mailchimpDatacenter = (apiKey: string): string | null => {
  const dc = apiKey.split('-').at(-1)
  return dc && dc !== apiKey ? dc : null
}

// Issues an authenticated request against a single audience member. Centralises
// the datacenter host, member URL, and Basic auth shared by upsert/unsubscribe.
const memberRequest = (apiKey: string, audienceId: string, email: string, method: string, body: unknown): Promise<Response> => {
  const datacenter = mailchimpDatacenter(apiKey)
  if (!datacenter) throw new Error('MAILCHIMP_API_KEY is missing its datacenter suffix (expected "<key>-usX").')

  const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash(email)}`
  // HTTP Basic auth: the username is ignored by Mailchimp, the API key is the password.
  const authorization = `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`

  return fetch(url, {
    method,
    headers: { authorization, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * Add or update a contact in the configured Mailchimp audience. Returns true
 * when the contact was synced, false when Mailchimp is not configured (so the
 * caller can avoid, e.g., sending a "you're subscribed" email for a no-op);
 * throws only on an actual Mailchimp API error so the caller can log it.
 */
export async function upsertContact(contact: MailchimpContact): Promise<boolean> {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    console.warn(
      `[mailchimp] not configured (need MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID) — skipped upsert for "${contact.email}".`,
    )
    return false
  }

  const mergeFields: Record<string, string> = {}
  if (contact.firstName) mergeFields.FNAME = contact.firstName
  if (contact.lastName) mergeFields.LNAME = contact.lastName

  const body: Record<string, unknown> = {
    email_address: contact.email,
    status_if_new: contact.statusIfNew ?? 'subscribed',
  }
  if (Object.keys(mergeFields).length > 0) body.merge_fields = mergeFields
  if (contact.tags && contact.tags.length > 0) body.tags = contact.tags

  const response = await memberRequest(apiKey, audienceId, contact.email, 'PUT', body)

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Mailchimp upsert returned ${response.status}. ${detail.slice(0, 300)}`.trim())
  }

  return true
}

/**
 * Unsubscribe a contact from the audience (sets their status to
 * "unsubscribed"). Idempotent: a 404 (never a member) counts as success.
 * Returns false when Mailchimp is not configured; throws on a real API error.
 */
export async function unsubscribeContact(email: string): Promise<boolean> {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    console.warn(`[mailchimp] not configured (need MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID) — skipped unsubscribe for "${email}".`)
    return false
  }

  const response = await memberRequest(apiKey, audienceId, email, 'PATCH', { status: 'unsubscribed' })

  if (response.status === 404) return true
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Mailchimp unsubscribe returned ${response.status}. ${detail.slice(0, 300)}`.trim())
  }

  return true
}

// Signed unsubscribe links. The token is an HMAC of the email keyed on the
// Mailchimp API key (a server-only secret that's always present whenever a
// contact was synced), so a link can't be used to unsubscribe an arbitrary
// address. Rotating the API key invalidates old links, which is acceptable.
const unsubscribeSecret = (): string => {
  const secret = process.env.MAILCHIMP_API_KEY
  if (!secret) throw new Error('MAILCHIMP_API_KEY must be set to sign unsubscribe links.')
  return secret
}

export const unsubscribeToken = (email: string): string =>
  createHmac('sha256', unsubscribeSecret()).update(email.trim().toLowerCase()).digest('hex')

export const verifyUnsubscribeToken = (email: string, token: string): boolean => {
  if (!token) return false
  const expected = unsubscribeToken(email)
  if (expected.length !== token.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
}
