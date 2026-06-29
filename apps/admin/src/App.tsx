import { useCallback, useEffect, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { type CmsSnapshot, type ProductFile } from '@designing-minds/cms'
import { repository } from './repository'
import { collectionRegistry } from './cms/registry'
import { createAdminAdapter } from './cms/adapter'
import { getRecordTitle } from './cms/record'
import type { AdminCollection, AdminRecord } from './cms/types'
import { Shell } from './components/Shell'
import { StatePanel } from './components/ui'
import { ScrollArea } from './components/primitives'
import { AdminWorkspace } from './screens/AdminWorkspace'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { useAdminAuth } from './lib/auth'

function App() {
  const { session, loading: authLoading, isAdmin } = useAdminAuth()
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

  const uploadFile = useCallback(
    (record: AdminRecord, file: File): Promise<ProductFile> => adapter.uploadFile(record, file),
    [adapter],
  )

  const shellProps = { message, error }

  if (authLoading) {
    return <StatePanel eyebrow="Admin" title="Checking access…" />
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
              onUpload={uploadFile}
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
  )
}

export default App
