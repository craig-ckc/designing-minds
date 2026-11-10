/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import type { PreviewPdf, ProductFile, ProductImage } from '@designing-minds/cms'
import { UploadAbortedError, UploadFailedError, type UploadPurpose } from './upload-transport'
import { rejectUpload } from './upload-rules'
import { needsImageCompression, prepareUpload } from './image-compression'

/* -------------------------------------------------------------------------
   Background uploads.

   The queue lives in a module-level store, NOT in component state, because the
   whole point is that it survives the editor unmounting: an admin can start a
   40MB upload, navigate to another record, and the bytes keep going.

   What can't survive is a real page load — a refresh or a closed tab tears the
   JavaScript down and the request dies with it. Nothing can prevent that, so
   instead the provider registers a beforeunload guard while anything is in
   flight, and the field shows explicit progress, so leaving mid-upload is a
   decision rather than an accident.

   One queue serves every upload field. What a finished upload BECOMES differs —
   a purchased file (private bucket, signed on demand), a gallery image, or a
   preview PDF (both public bucket, permanent url) — so the artefact is typed
   as the union and the field that started the job is the thing that knows
   which arm it is. Gallery images are prepared locally before the existing
   uploader moves the bytes and reports progress.

   Where a finished file lands depends on who is listening:
     * the editor for that record is open  → it receives the file and folds it
       into the draft, so the admin sees it appear and saves when ready
     * nobody is listening (navigated away) → the provider persists it against
       the stored record, so a background upload isn't silently lost
   ------------------------------------------------------------------------- */

export type UploadStatus = 'uploading' | 'done' | 'error'

export type { UploadPurpose }

interface StartInput {
  collectionId: string
  recordId: string
  fieldKey: string
  purpose: UploadPurpose
  file: File
  replacesFileId?: string
}

/** What a finished upload becomes, by purpose. */
export type UploadedArtifact = ProductFile | ProductImage | PreviewPdf

export interface UploadJob {
  id: string
  collectionId: string
  recordId: string
  /** Record key the file belongs to, e.g. `purchasedFiles`. */
  fieldKey: string
  /** Which bucket the bytes are going to, and so what they come back as. */
  purpose: UploadPurpose
  filename: string
  sizeBytes: number
  /** 0–1. */
  progress: number
  status: UploadStatus
  /** Image conversion precedes the ordinary upload, while staying cancellable. */
  compressing?: boolean
  /** What to tell the editor, in plain English. */
  error?: string
  /** Storage's own code and message, kept for the cases our sentences don't cover. */
  errorDetail?: string
  /** Set when this upload replaces an existing file rather than adding one. */
  replacesFileId?: string
}

type Listener = () => void

const listeners = new Set<Listener>()
const aborts = new Map<string, () => void>()
let jobs: UploadJob[] = []
// Keep the browser file metadata separately from UploadJob: image preparation
// can change the job's displayed filename and size before storage rejects it.
const retryIdentities = new Map<string, string>()

const retryIdentity = (input: StartInput) => JSON.stringify([
  input.collectionId, input.recordId, input.fieldKey, input.purpose,
  input.replacesFileId ?? null, input.file.name, input.file.size,
  input.file.lastModified, input.file.type,
])

const emit = () => {
  // A new array identity each time, so useSyncExternalStore sees the change.
  jobs = [...jobs]
  for (const listener of listeners) listener()
}

const subscribe = (listener: Listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => jobs

const patch = (id: string, changes: Partial<UploadJob>) => {
  jobs = jobs.map((job) => (job.id === id ? { ...job, ...changes } : job))
  emit()
}

/** Live handlers, keyed `collectionId:recordId:fieldKey`, for open editors. */
const targets = new Map<string, (file: UploadedArtifact, replacesFileId?: string) => void>()
const targetKey = (collectionId: string, recordId: string, fieldKey: string) =>
  `${collectionId}:${recordId}:${fieldKey}`

/* ------------------------------- Provider ------------------------------- */

interface UploadsValue {
  jobs: UploadJob[]
  start: (input: StartInput) => void
  /** Remove a finished or failed job from the list. */
  dismiss: (id: string) => void
  cancel: (id: string) => void
}

const UploadsContext = createContext<UploadsValue | null>(null)

export function UploadsProvider({
  children,
  upload,
  onOrphaned,
  onNotify,
}: {
  children: ReactNode
  /** Reserve storage and PUT the bytes, reporting progress and a cancel handle. */
  upload: (
    recordId: string,
    file: File,
    purpose: UploadPurpose,
    onProgress: (fraction: number) => void,
    onAbortHandle: (abort: () => void) => void,
  ) => Promise<UploadedArtifact>
  /** Attach a finished file when no editor is open to receive it. */
  onOrphaned: (job: UploadJob, file: UploadedArtifact) => Promise<void>
  /** Tell the admin an upload finished (or failed) — they may be elsewhere. */
  onNotify: (message: string, tone: 'info' | 'error') => void
}) {
  // Kept in a ref so `start` stays stable while always calling the latest
  // callbacks — a job outlives the render that started it. Written in an effect
  // rather than during render, which React forbids.
  const live = useRef({ upload, onOrphaned, onNotify })
  useEffect(() => {
    live.current = { upload, onOrphaned, onNotify }
  }, [upload, onOrphaned, onNotify])

  const start = useCallback((input: StartInput) => {
    const id = crypto.randomUUID()
    const identity = retryIdentity(input)
    // Replacing only failed attempts makes a picker retry tidy without
    // conflating parallel uploads or separate destinations.
    const previousFailures = jobs.filter((entry) => entry.status === 'error' && retryIdentities.get(entry.id) === identity)
    if (previousFailures.length > 0) {
      const previousFailureIds = new Set(previousFailures.map((entry) => entry.id))
      jobs = jobs.filter((entry) => !previousFailureIds.has(entry.id))
      previousFailures.forEach((entry) => retryIdentities.delete(entry.id))
    }
    const job: UploadJob = {
      id,
      collectionId: input.collectionId,
      recordId: input.recordId,
      fieldKey: input.fieldKey,
      purpose: input.purpose,
      filename: input.file.name,
      sizeBytes: input.file.size,
      progress: 0,
      status: 'uploading',
      replacesFileId: input.replacesFileId,
    }
    retryIdentities.set(id, identity)

    /* The one gate every upload passes through — too big or the wrong kind of
       file for this zone, and not a single byte leaves the browser.

       Here rather than in the fields because this is where they all converge:
       three fields, a file picker and a drag & drop each, and `accept` on the
       input covers only one of those six paths. The job is still created, just
       already failed, so the answer appears in the field the file was dropped
       on instead of in a dialog the editor has to dismiss. */
    const refusal = rejectUpload(input.purpose, input.file)
    if (refusal) {
      jobs = [...jobs, { ...job, status: 'error', error: refusal }]
      emit()
      const targetIsOpen = targets.has(targetKey(input.collectionId, input.recordId, input.fieldKey))
      live.current.onNotify(
        targetIsOpen ? `${input.file.name} was not uploaded. See the field for details.` : `${input.file.name} was not uploaded. ${refusal}`,
        'error',
      )
      return
    }

    jobs = [...jobs, job]
    emit()

    const controller = new AbortController()
    let uploadAbort: (() => void) | undefined
    aborts.set(id, () => {
      controller.abort()
      uploadAbort?.()
    })

    void (async () => {
      try {
        patch(id, { compressing: needsImageCompression(input.file, input.purpose) })
        const prepared = await prepareUpload(input.file, input.purpose, controller.signal)
        if (controller.signal.aborted) throw new UploadAbortedError()
        const preparedRefusal = rejectUpload(input.purpose, prepared)
        if (preparedRefusal) throw new Error(preparedRefusal)
        patch(id, { compressing: false, filename: prepared.name, sizeBytes: prepared.size })
        const file = await live.current.upload(
          input.recordId,
          prepared,
          input.purpose,
          (fraction) => patch(id, { progress: fraction }),
          (abort) => {
            uploadAbort = abort
            if (controller.signal.aborted) abort()
          },
        )
        if (controller.signal.aborted) throw new UploadAbortedError()
        patch(id, { progress: 1, status: 'done' })

        const handler = targets.get(targetKey(input.collectionId, input.recordId, input.fieldKey))
        if (handler) {
          handler(file, input.replacesFileId)
        } else {
          // Nobody is watching this record — write it through so the upload
          // isn't lost, then say so, since the admin is looking elsewhere.
          await live.current.onOrphaned(job, file)
        }
        live.current.onNotify(`${input.file.name} uploaded.`, 'info')

        // The file is now visible as a card, so the finished job has nothing
        // left to show; dropping it keeps the queue from growing all session.
        jobs = jobs.filter((entry) => entry.id !== id)
        retryIdentities.delete(id)
        emit()
      } catch (error) {
        if (controller.signal.aborted || error instanceof UploadAbortedError) {
          jobs = jobs.filter((entry) => entry.id !== id)
          retryIdentities.delete(id)
          emit()
          return
        }
        // The reason storage gave, not a generic failure: an editor needs to
        // know whether the file was too big, the bucket was missing, or the
        // connection dropped, because those are three different next moves.
        const message = error instanceof Error ? error.message : 'Upload failed.'
        const detail = error instanceof UploadFailedError ? error.detail : undefined
        patch(id, { status: 'error', error: message, errorDetail: detail })
        const targetIsOpen = targets.has(targetKey(input.collectionId, input.recordId, input.fieldKey))
        live.current.onNotify(
          targetIsOpen ? `${input.file.name} failed to upload. See the field for details.` : `${input.file.name} failed to upload. ${message}`,
          'error',
        )
      } finally {
        aborts.delete(id)
      }
    })()
  }, [])

  const dismiss = useCallback((id: string) => {
    jobs = jobs.filter((job) => job.id !== id)
    retryIdentities.delete(id)
    emit()
  }, [])

  const cancel = useCallback((id: string) => {
    aborts.get(id)?.()
    jobs = jobs.filter((job) => job.id !== id)
    retryIdentities.delete(id)
    emit()
  }, [])

  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const uploading = all.some((job) => job.status === 'uploading')

  // A refresh or a closed tab kills an in-flight upload outright, so make it a
  // deliberate choice rather than something that happens by accident.
  useEffect(() => {
    if (!uploading) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [uploading])

  const value = useMemo<UploadsValue>(() => ({ jobs: all, start, dismiss, cancel }), [all, start, dismiss, cancel])
  return <UploadsContext.Provider value={value}>{children}</UploadsContext.Provider>
}

export function useUploads(): UploadsValue {
  const ctx = useContext(UploadsContext)
  if (!ctx) throw new Error('useUploads must be used within UploadsProvider')
  return ctx
}

/** The jobs for one field of one record, in start order. */
export function useFieldUploads(collectionId: string, recordId: string, fieldKey: string): UploadJob[] {
  const { jobs: all } = useUploads()
  return useMemo(
    () => all.filter((job) => job.collectionId === collectionId && job.recordId === recordId && job.fieldKey === fieldKey),
    [all, collectionId, recordId, fieldKey],
  )
}

/**
 * Register the open editor as the destination for this field's uploads, so a
 * file that lands while it's on screen goes into the draft instead of being
 * written straight through.
 */
export function useUploadTarget<T extends UploadedArtifact>(
  collectionId: string,
  recordId: string,
  fieldKey: string,
  handler: (file: T, replacesFileId?: string) => void,
) {
  const live = useRef(handler)
  useEffect(() => {
    live.current = handler
  }, [handler])

  useEffect(() => {
    const key = targetKey(collectionId, recordId, fieldKey)
    // The field that registered owns this fieldKey, so it is the authority on
    // which arm of the union its own uploads come back as.
    const forward = (file: UploadedArtifact, replacesFileId?: string) => live.current(file as T, replacesFileId)
    targets.set(key, forward)
    return () => {
      // Only clear our own registration — a remount may have replaced it.
      if (targets.get(key) === forward) targets.delete(key)
    }
  }, [collectionId, recordId, fieldKey])
}
