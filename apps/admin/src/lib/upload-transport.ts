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
 * Mirrors the `purpose` accepted by POST /api/admin/upload-url.
 */
export type UploadPurpose = 'purchased' | 'gallery'

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
      } else {
        reject(new Error(`Upload failed (${request.status}).`))
      }
    }

    request.onerror = () => reject(new Error('Upload failed — check your connection.'))
    request.ontimeout = () => reject(new Error('Upload timed out.'))
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
