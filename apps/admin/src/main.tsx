import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AdminAuthProvider } from './lib/auth.tsx'
import { UnsavedChangesProvider } from './lib/unsaved.tsx'

// A data router (not <BrowserRouter>) so the editor can block in-app
// navigation with useBlocker while a draft has unsaved changes.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AdminAuthProvider>
        <UnsavedChangesProvider>
          <App />
        </UnsavedChangesProvider>
      </AdminAuthProvider>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
