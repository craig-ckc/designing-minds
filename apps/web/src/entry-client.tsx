import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import type { CmsSnapshot } from '@designing-minds/cms'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth.tsx'

declare global {
  interface Window {
    /** Build-time public snapshot embedded by the prerender step. */
    __DM_PUBLIC_SNAPSHOT__?: CmsSnapshot
  }
}

const container = document.getElementById('root')!
const bootstrap = window.__DM_PUBLIC_SNAPSHOT__ ?? null

const tree = (
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App initialSnapshot={bootstrap} />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

// Prerendered pages ship server-rendered markup + a bootstrap snapshot, so we
// hydrate them. The SPA fallback shell ships an empty root with no snapshot, so
// we render from scratch (functional routes load their own data).
if (bootstrap && container.hasChildNodes()) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
