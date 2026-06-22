import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import {
  updateFaqInSnapshot,
  updateProductInSnapshot,
  updateSubjectInSnapshot,
  updateTestimonialInSnapshot,
  type CmsSnapshot,
  type Faq,
  type Product,
  type Subject,
  type Testimonial,
} from '@designing-minds/cms'
import { repository } from './repository'
import { Shell } from './components/Shell'
import { StatePanel } from './components/ui'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductEditorPage } from './pages/ProductEditorPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectEditorPage } from './pages/SubjectEditorPage'
import { FaqsPage } from './pages/FaqsPage'
import { FaqEditorPage } from './pages/FaqEditorPage'
import { TestimonialsPage } from './pages/TestimonialsPage'
import { TestimonialEditorPage } from './pages/TestimonialEditorPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { PaymentsPage } from './pages/PaymentsPage'

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
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load CMS content.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const saveProduct = useCallback(async (draft: Product): Promise<Product | null> => {
    if (!repository.canWrite) return null
    setSaving(true)
    try {
      const saved = await repository.saveProduct(draft)
      setSnapshot((current) => (current ? updateProductInSnapshot(current, saved) : current))
      setMessage(`Saved product: ${saved.title}`)
      setError(null)
      return saved
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save product.')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const saveSubject = useCallback(async (draft: Subject): Promise<Subject | null> => {
    if (!repository.canWrite) return null
    setSaving(true)
    try {
      const saved = await repository.saveSubject(draft)
      setSnapshot((current) => (current ? updateSubjectInSnapshot(current, saved) : current))
      setMessage(`Saved subject: ${saved.name}`)
      setError(null)
      return saved
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save subject.')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const saveFaq = useCallback(async (draft: Faq): Promise<Faq | null> => {
    if (!repository.canWrite) return null
    setSaving(true)
    try {
      const saved = await repository.saveFaq(draft)
      setSnapshot((current) => (current ? updateFaqInSnapshot(current, saved) : current))
      setMessage('Saved FAQ')
      setError(null)
      return saved
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save FAQ.')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const saveTestimonial = useCallback(async (draft: Testimonial): Promise<Testimonial | null> => {
    if (!repository.canWrite) return null
    setSaving(true)
    try {
      const saved = await repository.saveTestimonial(draft)
      setSnapshot((current) => (current ? updateTestimonialInSnapshot(current, saved) : current))
      setMessage(`Saved testimonial: ${saved.customerName}`)
      setError(null)
      return saved
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save testimonial.')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const resetContent = useCallback(async () => {
    if (!repository.reset) return
    setSaving(true)
    try {
      await repository.reset()
      const next = await repository.getSnapshot()
      setSnapshot(next)
      setMessage('Content reset to the seed snapshot.')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reset content.')
    } finally {
      setSaving(false)
    }
  }, [])

  const shellProps = { onReset: () => void resetContent(), saving, message, error }

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

        {/* Catalogue collections */}
        <Route path="/products" element={<ProductsPage snapshot={snapshot} />} />
        <Route path="/products/:id" element={<ProductEditorPage snapshot={snapshot} onSave={saveProduct} saving={saving} />} />
        <Route path="/subjects" element={<SubjectsPage snapshot={snapshot} />} />
        <Route path="/subjects/:id" element={<SubjectEditorPage snapshot={snapshot} onSave={saveSubject} saving={saving} />} />
        <Route path="/faqs" element={<FaqsPage snapshot={snapshot} />} />
        <Route path="/faqs/:id" element={<FaqEditorPage snapshot={snapshot} onSave={saveFaq} saving={saving} />} />
        <Route path="/testimonials" element={<TestimonialsPage snapshot={snapshot} />} />
        <Route path="/testimonials/:id" element={<TestimonialEditorPage snapshot={snapshot} onSave={saveTestimonial} saving={saving} />} />

        {/* Operations (read-mostly) */}
        <Route path="/orders" element={<OrdersPage snapshot={snapshot} />} />
        <Route path="/orders/:id" element={<OrderDetailPage snapshot={snapshot} />} />
        <Route path="/customers" element={<CustomersPage snapshot={snapshot} />} />
        <Route path="/customers/:id" element={<CustomerDetailPage snapshot={snapshot} />} />
        <Route path="/payments" element={<PaymentsPage snapshot={snapshot} />} />

        <Route path="*" element={<StatePanel eyebrow="404" title="Not found" body="This admin route doesn’t exist." />} />
      </Routes>
    </Shell>
  )
}

export default App
