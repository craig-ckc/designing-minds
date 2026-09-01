/* -------------------------------------------------------------------------
   Uploading bytes to a signed URL, with progress.

   This is XMLHttpRequest rather than fetch on purpose: fetch has no upload
   progress event, so a large file gives you nothing to show between "started"
   and "finished". `upload.onprogress` is the only browser API that reports how
   far a request body has actually gone, and an editor waiting on a 40MB PDF
   needs to see that it is moving.
   ------------------------------------------------------------------------- */

/**
 * Which bucket an upload is bound for, and so what it becomes on the record.
 *
 * 'purchased' is paid content in the private bucket, reachable only through a
 * signed URL after an entitlement check. 'gallery' is public marketing in the
 * public media bucket, carrying a permanent URL the prerendered site can embed.
 * 'preview' is the free public PDF preview — also the public media bucket with
 * a permanent URL, but under its own `previews/` prefix so it stays distinct
 * from gallery images in storage. Mirrors the `purpose` accepted by
 * POST /api/admin/upload-url.
 */
export type UploadPurpose = 'purchased' | 'gallery' | 'preview'

export interface UploadHandle {
  /** Resolves when the object is stored; rejects on network/HTTP failure or abort. */
  done: Promise<void>
  /** Cancel the in-flight request. `done` rejects with an AbortError-like message. */
  abort: () => void
}

export class UploadAbortedError extends Error {
  constructor() {
    super('Upload cancelled.')
    this.name = 'UploadAbortedError'
  }
}

/**
 * An upload storage rejected, with the reason it gave.
 *
 * `message` is what an editor is told — plain English, and where possible the
 * thing to actually do about it. `detail` is storage's own words, kept verbatim
 * so a cause we have not written a sentence for is still legible instead of
 * being swallowed. Both are shown: "Upload failed (400)" was true and useless,
 * and the whole point of this class is that nobody has to open the network tab
 * to find out whether a file was too big or a bucket was missing.
 */
export class UploadFailedError extends Error {
  /** HTTP status of the rejected PUT. */
  readonly status: number
  /** Storage's own code and message, e.g. `413 EntityTooLarge — The object exceeded the maximum allowed size`. */
  readonly detail?: string

  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.name = 'UploadFailedError'
    this.status = status
    this.detail = detail
  }
}

/**
 * Supabase Storage's error body. Every rejection is this shape:
 *   { "statusCode": "413", "error": "EntityTooLarge", "message": "The object exceeded the maximum allowed size" }
 * `statusCode` is a string, and on some paths it disagrees with the HTTP status
 * on the response — the body is the more specific of the two, so it wins when
 * naming the cause and the HTTP status is what gets reported as the status.
 */
interface StorageErrorBody {
  statusCode?: string
  error?: string
  message?: string
}

/** What the wording needs to know about the file — a `File` satisfies it. */
export interface UploadedBytes {
  size: number
  type?: string
}

const parseStorageError = (body: string): StorageErrorBody | null => {
  if (!body) return null
  try {
    const parsed: unknown = JSON.parse(body)
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as StorageErrorBody
  } catch {
    return null
  }
}

/** Storage's code + message, or the raw body when it isn't the JSON we expect. */
const detailOf = (status: number, body: string, parsed: StorageErrorBody | null): string | undefined => {
  if (!parsed) return body ? `${status} — ${body.slice(0, 200)}` : undefined
  const code = [parsed.statusCode ?? String(status), parsed.error].filter(Boolean).join(' ')
  return parsed.message ? `${code} — ${parsed.message}` : code || undefined
}

/**
 * Turn a storage rejection into a sentence an editor can act on.
 *
 * Matched on the code AND the message text rather than the HTTP status alone,
 * because the status is the least reliable part: the same "too big" refusal
 * arrives as 413 from the storage service and as 400 from the edge in front of
 * it, and a size limit that is a project setting is worth naming exactly —
 * it's the one cause here that is fixed in a dashboard, not in this app.
 */
const describeFailure = (status: number, parsed: StorageErrorBody | null, body: string, file: UploadedBytes): string => {
  const code = (parsed?.error ?? '').toLowerCase()
  const text = (parsed?.message ?? body ?? '').toLowerCase()
  const says = (pattern: RegExp) => pattern.test(code) || pattern.test(text)
  const size = formatBytes(file.size) ?? `${file.size} bytes`

  // No status at all: the request never got an answer, so there is nothing to
  // read a cause out of. putWithProgress words its own network and timeout
  // failures, but this keeps the mapping honest for any other caller.
  if (!status) return 'The upload never reached storage — nothing was sent back to explain why.'

  if (status === 413 || says(/entity.?too.?large|exceeded the maximum|payload too large|max(imum)?.{0,12}size|too.?large/)) {
    return `This file is ${size}, which is over the upload size limit set on the Supabase project. Raise Storage → Settings → "Upload file size limit" in Supabase, or make the file smaller.`
  }

  if (status === 507 || says(/quota|insufficient.?storage|out of space|disk.?full|no space/)) {
    return 'The storage project has no space left, so no file can be uploaded until space is freed or the plan is upgraded.'
  }

  if (status === 409 || says(/duplicate|already exists/)) {
    return 'Storage already holds a file under this name. Start the upload again — it takes a fresh name each time.'
  }

  if (status === 415 || says(/mime|content.?type not|not supported/)) {
    return `Storage does not accept ${file.type || 'this kind of file'} in this bucket.`
  }

  // The signed upload link is minted immediately before the bytes go out and
  // lasts two hours, so this is a genuinely slow upload rather than a stale
  // page — worth saying so, since "try again" is the right move either way.
  if (says(/jwt|signature|token|expired/)) {
    return 'The upload link expired before the file finished sending. Start the upload again.'
  }

  if (status === 401) return 'Your admin sign-in expired part-way through the upload. Sign in again, then re-upload.'
  if (status === 403 || says(/access denied|unauthorized|row.?level/)) {
    return 'Storage refused this upload — the bucket denied access.'
  }
  if (status === 404 || says(/bucket not found|no such bucket|not found/)) {
    return 'The storage bucket this file belongs in is missing, so there is nowhere to put it.'
  }
  if (status === 429 || says(/slow.?down|rate.?limit|too many/)) {
    return 'Storage is rate-limiting uploads right now. Wait a moment, then try again.'
  }
  if (status >= 500) return `Supabase Storage failed while receiving the file (HTTP ${status}). Try again in a moment.`

  // Nothing matched, so say what is known and let `detail` carry storage's
  // words — an unrecognised cause should still be readable without DevTools.
  return parsed?.message
    ? `Storage rejected the file: ${parsed.message}`
    : `Storage rejected the file (HTTP ${status}).`
}

/**
 * The error for a rejected upload: what to tell the editor, and what storage
 * said. Exported so the wording is testable without a browser — the mapping is
 * the whole value of this module and it should not only be exercised by
 * uploading a 100MB file by hand.
 */
export function explainUploadFailure(status: number, body: string, file: UploadedBytes): UploadFailedError {
  const trimmed = body.trim()
  const parsed = parseStorageError(trimmed)
  return new UploadFailedError(
    describeFailure(status, parsed, trimmed, file),
    status,
    detailOf(status, trimmed, parsed),
  )
}

/**
 * PUT a file to a signed URL, reporting progress as a 0–1 fraction.
 *
 * `onProgress` is only called when the browser reports a computable length;
 * for a chunked response it stays at its last value rather than jumping around.
 */
export function putWithProgress(url: string, file: File, onProgress: (fraction: number) => void): UploadHandle {
  const request = new XMLHttpRequest()

  const done = new Promise<void>((resolve, reject) => {
    request.open('PUT', url, true)
    if (file.type) request.setRequestHeader('content-type', file.type)

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.min(1, event.loaded / event.total))
    }

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        // The last progress event can land just short of the full byte count.
        onProgress(1)
        resolve()
        return
      }
      // The response BODY is the only place the reason exists — the status on
      // its own cannot tell a file that is too big from a bucket that is gone.
      const body = typeof request.responseText === 'string' ? request.responseText : ''
      reject(explainUploadFailure(request.status, body, file))
    }

    request.onerror = () =>
      reject(
        new UploadFailedError(
          'The connection to storage dropped before the file finished sending. Check your internet and try again.',
          0,
        ),
      )
    request.ontimeout = () => reject(new UploadFailedError('The upload timed out before it finished.', 0))
    request.onabort = () => reject(new UploadAbortedError())

    request.send(file)
  })

  return { done, abort: () => request.abort() }
}

/** `82.6 kB`, `1.4 MB` — matches the size shown beside an uploaded file. */
export function formatBytes(bytes: number | undefined): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return null
  if (bytes < 1000) return `${bytes} B`
  const units = ['kB', 'MB', 'GB']
  let value = bytes / 1000
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000
    unit += 1
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`
}
