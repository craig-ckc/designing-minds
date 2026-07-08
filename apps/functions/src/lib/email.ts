import { Resend } from 'resend'

/* -------------------------------------------------------------------------
   Transactional email via Resend.

   Used to forward form submissions (and, later, purchase notifications) to the
   Designing Minds inbox. Sending is gated on configuration: if the Resend env
   vars are absent the send is skipped with a warning rather than throwing, so
   local/dev and un-provisioned environments keep working. Callers treat email
   as best-effort — a failure here must never fail the underlying operation
   (the submission is already persisted in Postgres).

   To go live, set on the functions project:
     RESEND_API_KEY        — API key from resend.com
     RESEND_FROM           — verified sender, e.g. "Designing Minds <noreply@designingminds.co.za>"
     FORM_NOTIFICATIONS_TO — inbox that should receive submissions
   ------------------------------------------------------------------------- */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export interface FormNotification {
  /** Email subject line. */
  subject: string
  /** Human heading at the top of the email body. */
  heading: string
  /** The submitted fields, rendered as a labelled table. */
  fields: Record<string, string>
  /** ISO timestamp of the submission. */
  submittedAt: string
  /** Optional reply-to (the submitter's address) so replies reach them. */
  replyTo?: string
}

const row = (label: string, value: string) =>
  `<tr>
     <td style="padding:6px 12px;border:1px solid #e4e4e1;font-weight:600;text-transform:capitalize;vertical-align:top;">${escapeHtml(label)}</td>
     <td style="padding:6px 12px;border:1px solid #e4e4e1;white-space:pre-wrap;">${escapeHtml(value)}</td>
   </tr>`

const renderHtml = (input: FormNotification) => {
  const rows = Object.entries(input.fields)
    .map(([key, value]) => row(key, value))
    .join('')
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111113;max-width:640px;">
    <h2 style="margin:0 0 4px;">${escapeHtml(input.heading)}</h2>
    <p style="margin:0 0 16px;color:#6c6c74;font-size:13px;">Received ${escapeHtml(input.submittedAt)}</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
  </div>`
}

/**
 * Send a form-submission notification. Resolves silently (no throw) when Resend
 * is not configured; throws only on an actual Resend API error so the caller
 * can log it.
 */
export async function sendFormNotification(input: FormNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const to = process.env.FORM_NOTIFICATIONS_TO

  if (!apiKey || !from || !to) {
    console.warn(
      `[email] Resend not configured (need RESEND_API_KEY, RESEND_FROM, FORM_NOTIFICATIONS_TO) — skipped "${input.subject}".`,
    )
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: input.subject,
    html: renderHtml(input),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  })
  if (error) throw new Error(typeof error === 'string' ? error : (error.message ?? 'Resend send failed.'))
}
