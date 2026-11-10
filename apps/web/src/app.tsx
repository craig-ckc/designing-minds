import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useCatalog } from './lib/catalog'
import { CatalogGate } from './lib/catalog-gate'
import { mergeSignedInCart } from './lib/cart'
import { mergeSignedInPhysicalCart } from './lib/physical-cart'
import { CommercePaymentPage } from './pages/commerce-payment-page'
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
import { CartPage } from './pages/cart-page'
import { NotFoundPage } from './pages/not-found-page'

/* Functional, non-indexed routes are never prerendered: the deploy serves them
   the empty `_shell.html` and the client renders them from scratch, so
   code-splitting them cannot affect hydration. Catalogue pages stay eager —
   they hydrate prerendered markup. */
const lazyPage = <Name extends string>(load: () => Promise<Record<Name, ComponentType>>, name: Name) =>
  lazy(() => load().then((module) => ({ default: module[name] })))

const HeroDemoPage = lazy(() => import('./pages/hero-demo-page'))
const SignUpPage = lazyPage(() => import('./pages/auth/sign-up-page'), 'SignUpPage')
const LoginPage = lazyPage(() => import('./pages/auth/login-page'), 'LoginPage')
const ForgotPasswordPage = lazyPage(() => import('./pages/auth/forgot-password-page'), 'ForgotPasswordPage')
const ResetPasswordPage = lazyPage(() => import('./pages/auth/reset-password-page'), 'ResetPasswordPage')
const AccountRoutes = lazyPage(() => import('./pages/account/account-routes'), 'AccountRoutes')
const CheckoutPage = lazyPage(() => import('./pages/checkout-page'), 'CheckoutPage')
const CheckoutReturnPage = lazyPage(() => import('./pages/checkout-return-page'), 'CheckoutReturnPage')
const CheckoutCancelPage = lazyPage(() => import('./pages/checkout-cancel-page'), 'CheckoutCancelPage')
const UnsubscribePage = lazyPage(() => import('./pages/unsubscribe-page'), 'UnsubscribePage')

function App() {
  const { customer } = useAuth()
  const { pathname } = useLocation()
  const { state } = useCatalog()
  const needsSavedCart = pathname === '/cart' || pathname === '/checkout'
  const commerceReady = state.snapshot?.commerceReady === true

  useEffect(() => {
    if (needsSavedCart && customer?.id) {
      void mergeSignedInCart(customer.id).catch(() => undefined)
    }
  }, [customer?.id, needsSavedCart])

  useEffect(() => {
    if (needsSavedCart && customer?.id && commerceReady) {
      void mergeSignedInPhysicalCart(customer.id).catch(() => undefined)
    }
  }, [customer?.id, needsSavedCart, commerceReady])

  // Keep the tab title + share tags in sync as the user navigates the SPA.
  useRouteHead(state.snapshot)

  return (
    <>
      <ScrollToTop />
      <Shell snapshot={state.snapshot}>
        <Suspense fallback={<StatePanel title="Loading…" />}>
          <Routes>
            {/* Home and About render their own loading/error per section. */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/hero-demo" element={<HeroDemoPage />} />

            {/* /bundles was renamed to /packages while it also covered access plans.
                Access plans are retired and the page is bundles-only again, but the
                redirect stays — the old path is still in the wild. */}
            <Route path="/bundles" element={<Navigate to="/packages" replace />} />

            {/* Legal */}
            <Route path="/privacy-policy" element={<LegalPage kind="privacy" />} />
            <Route path="/terms" element={<LegalPage kind="terms" />} />
            <Route path="/refund-policy" element={<LegalPage kind="refund" />} />

            {/* Authentication */}
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Payment return pages read no catalogue data */}
            <Route path="/checkout/return" element={<CheckoutReturnPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />

            {/* Everything below needs the published catalogue before it renders. */}
            <Route element={<CatalogGate />}>
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/:slug" element={<ProductPage />} />
              <Route path="/grades" element={<GradesPage />} />
              <Route path="/grades/:gradeSlug" element={<GradeDetailPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/account/*" element={<AccountRoutes />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/payment/:orderId" element={<CommercePaymentPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Shell>
    </>
  )
}

export default App
