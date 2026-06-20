import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import {
  updatePageInSnapshot,
  updateProductInSnapshot,
  type CmsPage,
  type CmsProduct,
  type CmsSnapshot,
} from '@designing-minds/cms'
import { repository } from './repository'
import { Shell } from './components/Shell'
import { StatePanel } from './components/ui'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductEditorPage } from './pages/ProductEditorPage'
import { OrdersPage } from './pages/OrdersPage'
import { CustomersPage } from './pages/CustomersPage'
import { ContentPage } from './pages/ContentPage'

function App() {
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const next = await repository.getSnapshot()
        if (!cancelled) {
          setSnapshot(next)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load CMS content.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const saveProduct = useCallback(
    async (draft: CmsProduct): Promise<CmsProduct | null> => {
      if (!repository.canWrite) {
        return null
      }
      setSaving(true)
      try {
        const saved = await repository.saveProduct(draft)
        setSnapshot((current) => (current ? updateProductInSnapshot(current, saved) : current))
        setMessage(`Saved product: ${saved.title}`)
        setError(null)
        return saved
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to save product.')
        return null
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const savePage = useCallback(
    async (draft: CmsPage): Promise<CmsPage | null> => {
      if (!repository.canWrite) {
        return null
      }
      setSaving(true)
      try {
        const saved = await repository.savePage(draft)
        setSnapshot((current) => (current ? updatePageInSnapshot(current, saved) : current))
        setMessage(`Saved page: ${saved.title}`)
        setError(null)
        return saved
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to save page.')
        return null
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const resetContent = useCallback(async () => {
    if (!repository.reset) {
      return
    }
    setSaving(true)
    try {
      await repository.reset()
      const next = await repository.getSnapshot()
      setSnapshot(next)
      setMessage('Content reset to the generated seed snapshot.')
      setError(null)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset CMS content.')
    } finally {
      setSaving(false)
    }
  }, [])

  const shellProps = {
    onReset: () => void resetContent(),
    saving,
    message,
    error,
  }

  if (!snapshot) {
    return (
      <Shell {...shellProps}>
        {error ? (
          <StatePanel eyebrow="Something went wrong" title="Content unavailable" body={error} />
        ) : (
          <StatePanel eyebrow="Loading" title="Preparing the workspace…" />
        )}
      </Shell>
    )
  }

  return (
    <Shell {...shellProps}>
      <Routes>
        <Route path="/" element={<DashboardPage snapshot={snapshot} />} />
        <Route path="/products" element={<ProductsPage snapshot={snapshot} />} />
        <Route
          path="/products/:id"
          element={<ProductEditorPage snapshot={snapshot} onSave={saveProduct} saving={saving} />}
        />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrdersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomersPage />} />
        <Route path="/content" element={<ContentPage snapshot={snapshot} onSave={savePage} saving={saving} />} />
        <Route path="*" element={<StatePanel eyebrow="404" title="Not found" body="This admin route doesn’t exist." />} />
      </Routes>
    </Shell>
  )
}

export default App
