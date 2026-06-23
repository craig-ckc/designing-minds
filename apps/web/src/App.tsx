import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
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
import { BundlesPage } from './pages/BundlesPage'
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
import { NotFoundPage } from './pages/NotFoundPage'

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

  let body: ReactNode
  if (error) {
    body = <StatePanel eyebrow="Something went wrong" title="Website unavailable" body={error} />
  } else if (authLoading || !snapshot) {
    body = <StatePanel eyebrow="Loading" title="Preparing the catalogue…" />
  } else {
    body = (
      <Routes>
        <Route path="/" element={<HomePage snapshot={snapshot} />} />

        {/* Browse */}
        <Route path="/shop" element={<ShopPage snapshot={snapshot} />} />
        <Route path="/grades" element={<GradesPage snapshot={snapshot} />} />
        <Route path="/grades/:gradeSlug" element={<GradeDetailPage snapshot={snapshot} />} />
        <Route path="/bundles" element={<BundlesPage snapshot={snapshot} />} />

        {/* Product */}
        <Route path="/product/:slug" element={<ProductPage snapshot={snapshot} />} />

        {/* Support + company */}
        <Route path="/help" element={<HelpPage snapshot={snapshot} />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage snapshot={snapshot} />} />

        {/* Legal */}
        <Route path="/privacy-policy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="/refund-policy" element={<LegalPage kind="refund" />} />

        {/* Authentication */}
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Customer Account */}
        <Route path="/account" element={<AccountPage snapshot={snapshot} />} />
        <Route path="/account/orders" element={<OrderHistoryPage snapshot={snapshot} />} />
        <Route path="/account/orders/:orderId" element={<OrderDetailPage snapshot={snapshot} onRefresh={refreshSnapshot} />} />

        {/* Commerce flow */}
        <Route path="/cart" element={<CartPage snapshot={snapshot} />} />
        <Route path="/checkout" element={<CheckoutPage snapshot={snapshot} />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    )
  }

  return (
    <>
      <ScrollToTop />
      <Shell snapshot={snapshot}>{body}</Shell>
    </>
  )
}

export default App
