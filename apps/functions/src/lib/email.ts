import { Resend } from 'resend'

/* -------------------------------------------------------------------------
   Transactional email via Resend.

   Two kinds of message:
     • sendFormNotification        — forwards a submission to the Designing Minds
                                      inbox (internal).
     • sendSubscriptionConfirmation — a branded "you're subscribed" email to the
                                      submitter, sent by us (not by Mailchimp)
                                      after they are added to the audience.

   Sending is gated on configuration: if the Resend env vars are absent the send
   is skipped with a warning rather than throwing, so local/dev and
   un-provisioned environments keep working. Callers treat email as best-effort
   — a failure here must never fail the underlying operation (the submission is
   already persisted in Postgres).

   To go live, set on the functions project:
     RESEND_API_KEY        — API key from resend.com
     RESEND_FROM           — verified sender, e.g. "Designing Minds <noreply@designingminds.co.za>"
     FORM_NOTIFICATIONS_TO — inbox that should receive submission notifications
   ------------------------------------------------------------------------- */

// Designing Minds brand palette (kept in sync with apps/web/src/index.css).
const BRAND = {
  primary: '#F15699',
  ink: '#1c1917',
  inkSoft: '#57534e',
  muted: '#79716b',
  line: '#ece8e1',
  surface: '#FBFAF9',
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Low-level send. Gated on RESEND_API_KEY + RESEND_FROM: returns false (no
 * throw) when Resend is not configured, true when the message was sent, and
 * throws only on an actual Resend API error so the caller can log it.
 */
async function sendViaResend(message: {
  to: string
  subject: string
  html: string
  replyTo?: string
  headers?: Record<string, string>
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    console.warn(`[email] Resend not configured (need RESEND_API_KEY, RESEND_FROM) — skipped "${message.subject}".`)
    return false
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    ...(message.headers ? { headers: message.headers } : {}),
  })
  if (error) throw new Error(typeof error === 'string' ? error : (error.message ?? 'Resend send failed.'))
  return true
}

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
 * Send a form-submission notification to the Designing Minds inbox. Resolves
 * silently (no throw) when Resend or the destination inbox is not configured;
 * throws only on an actual Resend API error so the caller can log it.
 */
export async function sendFormNotification(input: FormNotification): Promise<void> {
  const to = process.env.FORM_NOTIFICATIONS_TO
  if (!to) {
    console.warn(`[email] FORM_NOTIFICATIONS_TO not set — skipped notification "${input.subject}".`)
    return
  }
  await sendViaResend({ to, subject: input.subject, html: renderHtml(input), replyTo: input.replyTo })
}

export interface SubscriptionConfirmation {
  /** The subscriber's email address. */
  to: string
  /** Optional first name for the greeting. */
  firstName?: string
  /** One-click unsubscribe URL (signed). When set, shown as a link and exposed
   *  via the List-Unsubscribe header so mail clients surface a native control. */
  unsubscribeUrl?: string
}

const renderConfirmationHtml = (input: SubscriptionConfirmation) => {
  const greeting = input.firstName ? `Hi ${escapeHtml(input.firstName)},` : 'Hi there,'
  const footer = input.unsubscribeUrl
    ? `Changed your mind? <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${BRAND.muted};">Unsubscribe in one click</a>.`
    : "If you didn't sign up, just reply to this email and we'll remove you right away."
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:${BRAND.ink};max-width:560px;margin:0 auto;">
    <div style="background:${BRAND.primary};border-radius:16px 16px 0 0;padding:26px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:-0.01em;">Designing Minds</h1>
    </div>
    <div style="border:1px solid ${BRAND.line};border-top:none;border-radius:0 0 16px 16px;padding:28px 32px;background:${BRAND.surface};">
      <h2 style="margin:0 0 14px;font-size:20px;">You're on the list 🎉</h2>
      <p style="margin:0 0 14px;line-height:1.55;">${greeting}</p>
      <p style="margin:0 0 14px;line-height:1.55;">Thanks for subscribing to Designing Minds. You'll be among the first to hear about new teaching resources, bundles, and classroom ideas — no spam, just the good stuff.</p>
      <p style="margin:18px 0 0;color:${BRAND.muted};font-size:13px;line-height:1.5;">${footer}</p>
    </div>
    <p style="text-align:center;color:${BRAND.muted};font-size:12px;margin:16px 0 0;">Designing Minds · South Africa</p>
  </div>`
}

/**
 * Send our own branded "you're subscribed" confirmation to a new subscriber.
 * Returns true when sent, false when Resend is not configured; throws only on
 * an actual Resend API error so the caller can log it.
 */
export async function sendSubscriptionConfirmation(input: SubscriptionConfirmation): Promise<boolean> {
  return sendViaResend({
    to: input.to,
    subject: "You're subscribed to Designing Minds",
    html: renderConfirmationHtml(input),
    // RFC 2369: lets mail clients (Gmail, Apple Mail) show a native unsubscribe
    // control that opens our one-click page.
    ...(input.unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${input.unsubscribeUrl}>` } } : {}),
  })
}
