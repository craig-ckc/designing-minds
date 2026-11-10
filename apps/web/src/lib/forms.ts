import { apiUrl } from './api'
import { requestJson, RequestError } from './request-json'

/* -------------------------------------------------------------------------
   Public form submissions (newsletter, contact, unsubscribe).

   Every call goes through requestJson, so it gets the shared timeout, request
   id and diagnostics header. The <form> elements still carry a native
   action/method so a plain POST works before hydration — this is only the
   enhanced path.
   ------------------------------------------------------------------------- */

export type FormKind = 'newsletter' | 'contact'

const JSON_HEADERS = { 'content-type': 'application/json' }

/** Submit a public form. `website` is the honeypot field, which must be empty. Throws a RequestError on failure. */
export async function submitForm(
  form: FormKind,
  fields: Record<string, string>,
  website: string,
  send?: typeof fetch,
): Promise<void> {
  await requestJson<{ ok: boolean }>(
    apiUrl('/api/forms'),
    { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ form, fields, website }) },
    send,
  )
}

export type UnsubscribeOutcome = 'done' | 'invalid' | 'error'

/** Redeem a signed unsubscribe link. A 400 means the link is invalid or expired. */
export async function unsubscribeEmail(email: string, token: string, send?: typeof fetch): Promise<UnsubscribeOutcome> {
  try {
    await requestJson<{ unsubscribed: boolean }>(
      apiUrl('/api/unsubscribe'),
      { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email, token }) },
      send,
    )
    return 'done'
  } catch (error) {
    return error instanceof RequestError && error.status === 400 ? 'invalid' : 'error'
  }
}
