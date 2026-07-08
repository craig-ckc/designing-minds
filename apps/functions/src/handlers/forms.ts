import { badRequest, created, serverError, type Handler } from '../lib/http.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { sendFormNotification } from '../lib/email.ts'

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
}

const FORMS: Record<string, FormConfig> = {
  contact: {
    table: 'form_contact',
    required: ['name', 'email', 'message'],
    columns: ['name', 'email'],
    label: 'contact enquiry',
    subject: (fields) => `New contact enquiry from ${fields.name}`,
  },
  newsletter: {
    table: 'form_newsletter',
    required: ['email'],
    columns: ['email'],
    label: 'newsletter signup',
    subject: (fields) => `New newsletter signup: ${fields.email}`,
  },
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

export const forms: Handler = async (req) => {
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
    console.error('form submission failed:', error instanceof Error ? error.message : error)
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
    console.error('form notification email failed:', error instanceof Error ? error.message : error)
  }

  return created({ ok: true })
}
