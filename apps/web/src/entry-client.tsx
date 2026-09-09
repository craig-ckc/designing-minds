import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import type { CmsSnapshot } from '@designing-minds/cms'
import './index.css'
import App from './app.tsx'
import { AuthProvider } from './lib/auth.tsx'
import { installDiagnostics, reportRuntimeError } from './lib/diagnostics.ts'
import { AppErrorBoundary } from './components/app-error-boundary.tsx'

installDiagnostics()

declare global {
  interface Window {
    /** Build-time public snapshot loaded by the prerendered page. */
    __DM_PUBLIC_SNAPSHOT__?: CmsSnapshot
  }
}

const Container = document.getElementById('root')!
const bootstrap = window.__DM_PUBLIC_SNAPSHOT__ ?? null

const tree = (
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <AuthProvider>
          <App initialSnapshot={bootstrap} />
        </AuthProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>
)

// Prerendered pages ship server-rendered markup + a bootstrap snapshot, so we
// hydrate them. The SPA fallback Shell ships an empty root with no snapshot, so
// we render from scratch (functional routes load their own data).
if (bootstrap && Container.hasChildNodes()) {
  hydrateRoot(Container, tree, { onUncaughtError: (error) => reportRuntimeError(error), onCaughtError: (error) => reportRuntimeError(error, 'runtime.react'), onRecoverableError: (error) => reportRuntimeError(error) })
} else {
  createRoot(Container, { onUncaughtError: (error) => reportRuntimeError(error), onCaughtError: (error) => reportRuntimeError(error, 'runtime.react') }).render(tree)
}
