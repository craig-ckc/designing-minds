import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { repository } from './repository'
import { useAuth } from './lib/auth'
import { ScrollToTop } from './lib/ScrollToTop'
import { Shell } from './components/layout/Shell'
import { StatePanel } from './components/ui/StatePanel'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { GradesPage } from './pages/GradesPage'
import { GradeDetailPage } from './pages/GradeDetailPage'
import { PackagesPage } from './pages/PackagesPage'
import { ProductPage } from './pages/ProductPage'
import { HelpPage } from './pages/HelpPage'
import { ContactPage } from './pages/ContactPage'
import { AboutPage } from './pages/AboutPage'
import { LegalPage } from './pages/LegalPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { LoginPage } from './pages/auth/LoginPage'
import { AccountPage } from './pages/account/AccountPage'
import { OrderHistoryPage } from './pages/account/OrderHistoryPage'
import { OrderDetailPage } from './pages/account/OrderDetailPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CheckoutReturnPage } from './pages/CheckoutReturnPage'
import { CheckoutCancelPage } from './pages/CheckoutCancelPage'
import { FakePayfastPage } from './pages/FakePayfastPage'
import { NotFoundPage } from './pages/NotFoundPage'

function SnapshotGate({
  snapshot,
  error,
  children,
}: {
  snapshot: CmsSnapshot | null
  error: string | null
  children: (snapshot: CmsSnapshot) => ReactNode
}) {
  if (snapshot) return <>{children(snapshot)}</>
  if (error) return <StatePanel eyebrow="Something went wrong" title="Website unavailable" body={error} />
  return <StatePanel eyebrow="Loading" title="Preparing the catalogue…" />
}

function App() {
  const { loading: authLoading, session } = useAuth()
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshSnapshot = useCallback(async () => {
    try {
      const next = await repository.getSnapshot()
      setSnapshot(next)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load content.')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      if (!cancelled) await refreshSnapshot()
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, refreshSnapshot, session?.access_token])

  const body: ReactNode = (
    <Routes>
      <Route path="/" element={<HomePage snapshot={snapshot} loadError={error} />} />

      {/* Browse */}
      <Route path="/shop" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <ShopPage snapshot={ready} />}</SnapshotGate>} />
      <Route path="/grades" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <GradesPage snapshot={ready} />}</SnapshotGate>} />
      <Route
        path="/grades/:gradeSlug"
        element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <GradeDetailPage snapshot={ready} />}</SnapshotGate>}
      />
      <Route path="/packages" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <PackagesPage snapshot={ready} />}</SnapshotGate>} />
      {/* /bundles renamed to /packages (covers Bundles + Access Plans). Keep a redirect for any stray links. */}
      <Route path="/bundles" element={<Navigate to="/packages" replace />} />

      {/* Product */}
      <Route path="/product/:slug" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <ProductPage snapshot={ready} />}</SnapshotGate>} />

      {/* Support + company */}
      <Route path="/help" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <HelpPage snapshot={ready} />}</SnapshotGate>} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage snapshot={snapshot} loadError={error} />} />

      {/* Legal */}
      <Route path="/privacy-policy" element={<LegalPage kind="privacy" />} />
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="/refund-policy" element={<LegalPage kind="refund" />} />

      {/* Authentication */}
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Customer Account */}
      <Route path="/account" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <AccountPage snapshot={ready} />}</SnapshotGate>} />
      <Route
        path="/account/orders"
        element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <OrderHistoryPage snapshot={ready} />}</SnapshotGate>}
      />
      <Route
        path="/account/orders/:orderId"
        element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <OrderDetailPage snapshot={ready} onRefresh={refreshSnapshot} />}</SnapshotGate>}
      />

      {/* Commerce flow */}
      <Route path="/cart" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <CartPage snapshot={ready} />}</SnapshotGate>} />
      <Route path="/checkout" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <CheckoutPage snapshot={ready} />}</SnapshotGate>} />
      <Route path="/checkout/fake-payfast" element={<FakePayfastPage />} />
      <Route path="/checkout/return" element={<CheckoutReturnPage />} />
      <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )

  return (
    <>
      <ScrollToTop />
      <Shell snapshot={snapshot}>{body}</Shell>
    </>
  )
}

export default App
