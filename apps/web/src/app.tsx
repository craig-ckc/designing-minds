import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { withPricingTime, type CmsSnapshot } from '@designing-minds/cms'
import { repository } from './repository'
import { useAuth } from './lib/auth'
import { ScrollToTop } from './lib/scroll-to-top'
import { useRouteHead } from './lib/use-route-head'
import { Shell } from './components/layout/shell'
import { StatePanel } from './components/ui/state-panel'
import { HomePage } from './pages/home-page'
import { ShopPage } from './pages/shop-page'
import { GradesPage } from './pages/grades-page'
import { GradeDetailPage } from './pages/grade-detail-page'
import { PackagesPage } from './pages/packages-page'
import { ProductPage } from './pages/product-page'
import { HelpPage } from './pages/help-page'
import { ContactPage } from './pages/contact-page'
import { AboutPage } from './pages/about-page'
import { LegalPage } from './pages/legal-page'
import { SignUpPage } from './pages/auth/sign-up-page'
import { LoginPage } from './pages/auth/login-page'
import { ForgotPasswordPage } from './pages/auth/forgot-password-page'
import { ResetPasswordPage } from './pages/auth/reset-password-page'
import { AccountPage } from './pages/account/account-page'
import { OrderHistoryPage } from './pages/account/order-history-page'
import { OrderDetailPage } from './pages/account/order-detail-page'
import { CartPage } from './pages/cart-page'
import { CheckoutPage } from './pages/checkout-page'
import { CheckoutReturnPage } from './pages/checkout-return-page'
import { CheckoutCancelPage } from './pages/checkout-cancel-page'
import { UnsubscribePage } from './pages/unsubscribe-page'
import { NotFoundPage } from './pages/not-found-page'

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
  if (error) return <StatePanel title="Website unavailable" body={error} />
  return <StatePanel title="Preparing the catalogue…" />
}

function App({ initialSnapshot = null }: { initialSnapshot?: CmsSnapshot | null }) {
  const { loading: authLoading, session } = useAuth()
  // Seed from the build-time public snapshot (prerender/hydration) when present
  // so public pages paint immediately instead of showing "Preparing the
  // catalogue…". The effect below still refreshes — and for signed-in users it
  // pulls in their operational data (orders/payments), which the public
  // snapshot never carries.
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(() => initialSnapshot ? withPricingTime(initialSnapshot, Date.parse(initialSnapshot.generatedAt)) : null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!snapshot) return
    const now = Date.now()
    // The first hydrated render uses the build clock, then switches to now.
    const hasOldClock = [...snapshot.products, ...snapshot.bundles].some((record) => 'priceAsOf' in record && Number(record.priceAsOf) < now - 1000)
    const boundaries = [...snapshot.products, ...snapshot.bundles]
      .flatMap((record) => [record.saleStartsAt, record.saleEndsAt])
      .filter((date): date is string => Boolean(date))
      .map((date) => Date.parse(date)).filter((time) => time > now)
    if (boundaries.length === 0 && !hasOldClock) return
    const timer = window.setTimeout(() => setSnapshot((current) => current ? withPricingTime(current, Date.now()) : current), hasOldClock ? 0 : Math.min(Math.min(...boundaries) - now + 25, 2147483647))
    // Refresh scheduled displays after a sleeping tab becomes visible again.
    const resume = () => { if (document.visibilityState === 'visible') setSnapshot((current) => current ? withPricingTime(current, Date.now()) : current) }
    document.addEventListener('visibilitychange', resume)
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', resume) }
  }, [snapshot])

  // Keep the tab title + share tags in sync as the user navigates the SPA.
  useRouteHead(snapshot)

  const refreshSnapshot = useCallback(async () => {
    try {
      const next = await repository.getSnapshot()
      setSnapshot(withPricingTime(next, Date.now()))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load content.')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    // With a build-time snapshot and no signed-in session, trust it — the
    // runtime fetch is only a fallback (and would swap sanitized content for an
    // unsanitized read). Signed-in users still refresh to pull in their
    // operational data (orders/payments), which the public snapshot omits.
    if (initialSnapshot && !session?.access_token) return
    let cancelled = false
    const load = async () => {
      if (!cancelled) await refreshSnapshot()
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, refreshSnapshot, session?.access_token, initialSnapshot])

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
      {/* /bundles was renamed to /packages while it also covered access plans.
          Access plans are retired and the page is bundles-only again, but the
          redirect stays — the old path is still in the wild. */}
      <Route path="/bundles" element={<Navigate to="/packages" replace />} />

      {/* Product */}
      <Route path="/shop/:slug" element={<SnapshotGate snapshot={snapshot} error={error}>{(ready) => <ProductPage snapshot={ready} />}</SnapshotGate>} />

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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
      <Route path="/checkout/return" element={<CheckoutReturnPage />} />
      <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

      <Route path="/unsubscribe" element={<UnsubscribePage />} />

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
