import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, created, serverError, type Handler, type HandlerResponse } from '../lib/http.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { sendFormNotification, sendSubscriptionConfirmation } from '../lib/email.ts'
import { unsubscribeToken, upsertContact, type MailchimpStatus } from '../lib/mailchimp.ts'

/* -------------------------------------------------------------------------
   Public form submissions (contact + newsletter).

   One trusted endpoint for every public form. The browser POSTs
   { form, fields, website? }; this handler validates against a per-form config,
   writes the row with the service-role key (the browser never touches the
   table directly — see docs/decisions.md), then emails a best-effort
   notification. Adding a NEW form = add a table (migration) + one FORMS entry.
   Adding a FIELD to an existing form = nothing here; it flows into the jsonb
   "data" bag automatically.
   ------------------------------------------------------------------------- */

interface FormConfig {
  /** Physical table, named form_<name>. */
  table: string
  /** Fields that must be present and non-empty. */
  required: string[]
  /** Fields promoted to their own columns (the rest go into the jsonb bag). */
  columns: string[]
  /** Noun used in the notification heading. */
  label: string
  /** Notification subject line. */
  subject: (fields: Record<string, string>) => string
  /**
   * When set, upsert the submitter (by email) into the Mailchimp audience and
   * send them our branded confirmation email. `statusIfNew` applies only to
   * brand-new contacts — existing contacts keep their subscription status, so
   * an update never re-subscribes an opt-out.
   *
   * `consentField`, when set, gates the sync on a truthy value for that field
   * (a marketing-consent checkbox): no consent → no Mailchimp, no confirmation.
   * Forms without a `consentField` sync every submission (signing up is itself
   * the opt-in, e.g. the newsletter).
   */
  mailchimp?: {
    statusIfNew: MailchimpStatus
    tags?: string[]
    consentField?: string
  }
}

const FORMS: Record<string, FormConfig> = {
  contact: {
    table: 'form_contact',
    required: ['name', 'email', 'message'],
    columns: ['name', 'email'],
    label: 'contact enquiry',
    subject: (fields) => `New contact enquiry from ${fields.name}`,
    mailchimp: { statusIfNew: 'subscribed', tags: ['contact-form'], consentField: 'marketing' },
  },
  newsletter: {
    table: 'form_newsletter',
    required: ['email'],
    columns: ['email'],
    label: 'newsletter signup',
    subject: (fields) => `New newsletter signup: ${fields.email}`,
    mailchimp: { statusIfNew: 'subscribed', tags: ['newsletter'] },
  },
}

// Recognised truthy values for a consent checkbox (browsers send "on"/"true").
const CONSENT_VALUES = new Set(['true', 'on', 'yes', '1'])
const hasConsent = (value: string | undefined) => value != null && CONSENT_VALUES.has(value.trim().toLowerCase())

// Public origin used to build the one-click unsubscribe link. Null when unset,
// in which case the confirmation email falls back to reply-to-unsubscribe.
const siteBase = (): string | null => {
  const configured = process.env.SITE_URL
  if (!configured) return null
  const trimmed = configured.replace(/\/+$/, '')
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

const unsubscribeUrlFor = (email: string): string | undefined => {
  const base = siteBase()
  if (!base) return undefined
  return `${base}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FIELD_LENGTH = 5000

interface FormBody {
  form: string
  fields: Record<string, unknown>
  /** Honeypot: hidden field humans never fill; a value means a bot. */
  website?: string
}

function isFormBody(value: unknown): value is FormBody {
  if (typeof value !== 'object' || value === null) return false
  const body = value as FormBody
  return (
    typeof body.form === 'string' &&
    typeof body.fields === 'object' &&
    body.fields !== null &&
    !Array.isArray(body.fields)
  )
}

const header = (headers: Record<string, string | undefined>, name: string) => {
  const value = headers[name]
  return typeof value === 'string' && value ? value : null
}

// Headers arrive lower-cased from a real HTTP server, but tests (and some
// proxies) may hand us either casing — check both rather than picking one.
const headerAny = (headers: Record<string, string | undefined>, ...names: string[]): string | null => {
  for (const name of names) {
    const value = header(headers, name)
    if (value) return value
  }
  return null
}

/*
 * A native <form method="post"> submission arrives urlencoded and flat:
 * { form, website?, _return?, ...fields }. The JS client instead posts
 * JSON shaped as { form, fields, website? }. Recognise the flat shape (a
 * string `form` with no object `fields`) and lift every remaining key into
 * `fields`, mirroring what the JS client already sends — so the rest of the
 * handler only ever has to deal with one shape.
 */
function normalizeFormBody(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  if (typeof record.form !== 'string') return value

  const hasObjectFields = typeof record.fields === 'object' && record.fields !== null && !Array.isArray(record.fields)
  if (hasObjectFields) return value

  const { form, website, _return, ...rest } = record
  const fields: Record<string, unknown> = { ...rest }
  if (fields.name === undefined) {
    // Mirrors the JS client, which composes `name` from first + last itself.
    const composedName = [rest.firstName, rest.lastName]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ')
    if (composedName) fields.name = composedName
  }

  return {
    form,
    fields,
    ...(website !== undefined ? { website } : {}),
    ...(typeof _return === 'string' ? { _return } : {}),
  }
}

// A single-slash-rooted, same-origin path with no query/hash and no
// protocol-relative trick (`//evil.example`) — anything else falls back to a
// safe default rather than redirecting off-site.
const RETURN_PATH_RE = /^\/(?!\/)[^\s?#]*$/

function resolveReturnPath(value: unknown, fallback: string): string {
  return typeof value === 'string' && RETURN_PATH_RE.test(value) ? value : fallback
}

function safeOrigin(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null
  } catch {
    return null
  }
}

function normaliseSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

function resolveOrigin(headers: Record<string, string | undefined>): string {
  const fromOrigin = safeOrigin(headerAny(headers, 'origin', 'Origin'))
  if (fromOrigin) return fromOrigin

  const fromReferer = safeOrigin(headerAny(headers, 'referer', 'Referer'))
  if (fromReferer) return fromReferer

  const configured = process.env.SITE_URL
  return configured ? normaliseSiteUrl(configured) : ''
}

/*
 * A urlencoded content-type means the browser did a real navigation POST (no
 * JS intercepted it), so every outcome must be a redirect back to the page
 * instead of a JSON body the browser would otherwise render raw.
 */
function navigationResponse(headers: Record<string, string | undefined>, body: unknown, response: HandlerResponse): HandlerResponse {
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const formName = typeof record.form === 'string' ? record.form : undefined
  const formKey = formName && formName in FORMS ? formName : 'form'
  const defaultPath = formName === 'contact' ? '/contact' : '/'
  const returnPath = resolveReturnPath(record._return, defaultPath)
  const origin = resolveOrigin(headers)
  const succeeded = response.status >= 200 && response.status < 300

  return {
    status: 303,
    headers: { ...response.headers, location: `${origin}${returnPath}#${formKey}-${succeeded ? 'sent' : 'failed'}` },
    body: { ok: succeeded },
  }
}

const handleForm: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isFormBody(req.body)) return badRequest('Expected { form, fields }.')

  const config = FORMS[req.body.form]
  if (!config) return badRequest(`Unknown form "${req.body.form}".`)

  // Honeypot: a filled hidden field means a bot. Pretend success and store
  // nothing so the bot gets no signal that it was rejected.
  if (typeof req.body.website === 'string' && req.body.website.trim() !== '') {
    return created({ ok: true })
  }

  // Coerce, trim, and drop empty values.
  const fields: Record<string, string> = {}
  for (const [key, raw] of Object.entries(req.body.fields)) {
    if (raw == null) continue
    const value = String(raw).trim()
    if (!value) continue
    if (value.length > MAX_FIELD_LENGTH) return badRequest(`Field "${key}" is too long.`)
    fields[key] = value
  }

  for (const key of config.required) {
    if (!fields[key]) return badRequest(`Missing required field "${key}".`)
  }
  if (fields.email && !EMAIL_RE.test(fields.email)) return badRequest('Enter a valid email address.')

  // Split promoted columns from the variable jsonb bag.
  const promoted = new Set(config.columns)
  const dataBag: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (!promoted.has(key)) dataBag[key] = value
  }

  const row: Record<string, unknown> = {
    data: dataBag,
    sourceUrl: header(req.headers, 'referer'),
    userAgent: header(req.headers, 'user-agent')?.slice(0, 500) ?? null,
  }
  for (const column of config.columns) {
    if (fields[column] !== undefined) row[column] = fields[column]
  }

  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from(config.table).insert(row)
    if (error) throw new Error(error.message)
  } catch (error) {
    logEvent('forms.submission.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    return serverError('Unable to submit the form.')
  }

  // Best-effort notification: the submission is already persisted, so a Resend
  // failure must not fail the request.
  try {
    await sendFormNotification({
      subject: config.subject(fields),
      heading: `New ${config.label}`,
      fields,
      submittedAt: new Date().toISOString(),
      replyTo: fields.email,
    })
  } catch (error) {
    logEvent('forms.notification.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
  }

  // Best-effort audience sync: when the submitter has opted in, add or update
  // them in Mailchimp and send our own branded confirmation. Like the
  // notification email, the submission is already persisted so any failure here
  // must not fail the request.
  const mc = config.mailchimp
  const optedIn = mc != null && (mc.consentField == null || hasConsent(fields[mc.consentField]))
  if (mc && optedIn && fields.email) {
    const [firstName, ...lastNameParts] = (fields.name ?? '').split(/\s+/).filter(Boolean)
    let synced = false
    try {
      synced = await upsertContact({
        email: fields.email,
        firstName: firstName || undefined,
        lastName: lastNameParts.length > 0 ? lastNameParts.join(' ') : undefined,
        statusIfNew: mc.statusIfNew,
        tags: mc.tags,
      })
    } catch (error) {
      logEvent('forms.mailchimp.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    }

    // Only confirm when a contact was actually added/updated, so we never tell
    // someone they're subscribed when the sync was skipped or failed.
    if (synced) {
      try {
        await sendSubscriptionConfirmation({
          to: fields.email,
          firstName: firstName || undefined,
          unsubscribeUrl: unsubscribeUrlFor(fields.email),
        })
      } catch (error) {
        logEvent('forms.confirmation.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
      }
    }
  }

  return created({ ok: true })
}

export const forms: Handler = async (req) => {
  const normalizedBody = normalizeFormBody(req.body)
  const response = await handleForm(normalizedBody === req.body ? req : { ...req, body: normalizedBody })

  // A urlencoded body means a real browser navigation (no JS submitted it via
  // fetch), so this must resolve to a redirect the browser can follow — a raw
  // JSON response would otherwise just render as text in the tab.
  const contentType = headerAny(req.headers, 'content-type', 'Content-Type') ?? ''
  if (!contentType.toLowerCase().includes('application/x-www-form-urlencoded')) return response

  return navigationResponse(req.headers, normalizedBody, response)
}
