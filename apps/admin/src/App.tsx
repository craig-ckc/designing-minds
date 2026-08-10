import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { type CmsSnapshot, type ProductFile } from '@designing-minds/cms'
import { repository } from './repository'
import { collectionRegistry, getCollection } from './cms/registry'
import { createAdminAdapter, selectRecord } from './cms/adapter'
import { getPath, getRecordTitle, setPath } from './cms/record'
import type { AdminCollection, AdminRecord } from './cms/types'
import { UploadsProvider, type UploadJob } from './lib/uploads'
import { Shell } from './components/Shell'
import { StatePanel } from './components/ui'
import { ScrollArea } from './components/primitives'
import { AdminWorkspace } from './screens/AdminWorkspace'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { useAdminAuth } from './lib/auth'

function App() {
  const { session, loading: authLoading, isAdmin, recovery } = useAdminAuth()
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const adapter = useMemo(() => createAdminAdapter(repository), [])

  useEffect(() => {
    if (!session || !isAdmin) return
    let cancelled = false
    const load = async () => {
      try {
        const next = await repository.getSnapshot()
        if (!cancelled) {
          setSnapshot(next)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load CMS content.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin, session])

  const saveRecord = useCallback(
    async (collection: AdminCollection, record: AdminRecord): Promise<AdminRecord | null> => {
      if (!adapter.canWrite) return null
      setSaving(true)
      try {
        const { saved, apply } = await adapter.save(collection.id, record)
        setSnapshot((current) => (current ? apply(current) : current))
        setMessage(`Saved ${collection.singular.toLowerCase()}: ${getRecordTitle(collection, saved)}`)
        setError(null)
        return saved
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save record.')
        return null
      } finally {
        setSaving(false)
      }
    },
    [adapter],
  )

  // The upload queue outlives any one editor, so it reads the current snapshot
  // through a ref rather than closing over a stale one.
  const snapshotRef = useRef<CmsSnapshot | null>(null)
  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  const uploadFile = useCallback(
    (
      recordId: string,
      file: File,
      onProgress: (fraction: number) => void,
      onAbortHandle: (abort: () => void) => void,
    ): Promise<ProductFile> => adapter.uploadFile({ id: recordId }, file, onProgress, onAbortHandle),
    [adapter],
  )

  /**
   * A file that finished while its editor was closed.
   *
   * It is attached to the STORED record, not to a draft — by the time nobody is
   * listening the draft has either been saved or discarded (the unsaved-changes
   * guard makes sure of that), so writing through is the only way the upload
   * isn't quietly thrown away.
   */
  const attachOrphanedFile = useCallback(
    async (job: UploadJob, file: ProductFile) => {
      const collection = getCollection(job.collectionId)
      const current = snapshotRef.current
      if (!collection || !current) return
      const record = selectRecord(current, job.collectionId, job.recordId)
      if (!record) return

      const existing = (getPath(record, job.fieldKey) as ProductFile[] | undefined) ?? []
      const next = job.replacesFileId
        ? existing.map((entry) => (entry.id === job.replacesFileId ? { ...file, label: entry.label } : entry))
        : [...existing, file]
      await saveRecord(collection, setPath(record, job.fieldKey, next))
    },
    [saveRecord],
  )

  const notifyUpload = useCallback((text: string, tone: 'info' | 'error') => {
    if (tone === 'error') setError(text)
    else setMessage(text)
  }, [])

  // Confirmations are transient. Without this the "Saved …" note stayed pinned
  // to the corner for the rest of the session, so it stopped meaning "just
  // now" — part of why saving felt like it gave no feedback. Errors persist:
  // they describe a state the user still needs to deal with.
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [message])

  const shellProps = { message, error }

  if (authLoading) {
    return <StatePanel eyebrow="Admin" title="Checking access…" />
  }

  // A password-reset link establishes a temporary session, so this must take
  // precedence over both the login gate and the workspace.
  if (recovery) {
    return <ResetPasswordPage />
  }

  if (!session) {
    return <LoginPage />
  }

  if (!isAdmin) {
    return <StatePanel eyebrow="Admin" title="Not authorized" body="This account does not have administrator access." />
  }

  if (!snapshot) {
    return (
      <Shell {...shellProps} snapshot={null}>
        {error ? (
          <StatePanel eyebrow="Something went wrong" title="Content unavailable" body={error} />
        ) : (
          <StatePanel eyebrow="Loading" title="Preparing the workspace…" />
        )}
      </Shell>
    )
  }

  return (
    // Inside the router but outside the routes: an upload started on one record
    // keeps running while the admin navigates to another.
    <UploadsProvider upload={uploadFile} onOrphaned={attachOrphanedFile} onNotify={notifyUpload}>
      <Shell {...shellProps} snapshot={snapshot}>
        <Routes>
          <Route
            path="/"
            element={
              <ScrollArea className="min-h-0 flex-1">
                <DashboardPage snapshot={snapshot} />
              </ScrollArea>
            }
          />

          {collectionRegistry.flatMap((collection) => {
            const element = (
              <AdminWorkspace
                key={collection.id}
                collection={collection}
                snapshot={snapshot}
                saving={saving}
                onSave={saveRecord}
              />
            )
            return [
              <Route key={collection.id} path={`/${collection.id}`} element={element} />,
              <Route key={`${collection.id}/record`} path={`/${collection.id}/:recordId`} element={element} />,
            ]
          })}

          <Route path="*" element={<StatePanel eyebrow="404" title="Not found" body="This admin route doesn’t exist." />} />
        </Routes>
      </Shell>
    </UploadsProvider>
  )
}

export default App
