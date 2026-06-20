import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { repository } from './repository'
import { Shell } from './components/layout/Shell'
import { StatePanel } from './components/ui/StatePanel'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { CmsPage } from './pages/CmsPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const nextSnapshot = await repository.getSnapshot()
        if (!cancelled) {
          setSnapshot(nextSnapshot)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load content.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <Shell snapshot={null}>
        <StatePanel eyebrow="Something went wrong" title="Website unavailable" body={error} />
      </Shell>
    )
  }

  if (!snapshot) {
    return (
      <Shell snapshot={null}>
        <StatePanel eyebrow="Loading" title="Preparing the catalogue…" />
      </Shell>
    )
  }

  return (
    <Shell snapshot={snapshot}>
      <Routes>
        <Route path="/" element={<HomePage snapshot={snapshot} />} />
        <Route path="/shop" element={<ShopPage snapshot={snapshot} />} />
        <Route path="/product/:slug" element={<ProductPage snapshot={snapshot} />} />
        <Route path="/about" element={<AboutPage snapshot={snapshot} />} />
        <Route path="/about-3" element={<AboutPage snapshot={snapshot} />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/:slug" element={<CmsPage snapshot={snapshot} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Shell>
  )
}

export default App
