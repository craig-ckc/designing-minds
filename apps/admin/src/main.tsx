import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AdminAuthProvider } from './lib/auth.tsx'
import { UnsavedChangesProvider } from './lib/unsaved.tsx'
import { SiteStatusProvider } from './lib/site-status.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// A data router (not <BrowserRouter>) so the editor can block in-app
// navigation with useBlocker while a draft has unsaved changes.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      // Outermost guard. Shell has its own boundary around the routed content,
      // which keeps the chrome usable; this one catches anything above it so a
      // throw can never leave a blank page with no explanation.
      <ErrorBoundary label="The admin hit an unexpected error">
        <AdminAuthProvider>
          <UnsavedChangesProvider>
            <SiteStatusProvider>
              <App />
            </SiteStatusProvider>
          </UnsavedChangesProvider>
        </AdminAuthProvider>
      </ErrorBoundary>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
