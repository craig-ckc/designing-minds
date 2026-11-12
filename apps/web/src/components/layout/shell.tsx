import { type ReactNode } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { LiveRegionProvider } from '../ui/live-region'

/** Page frame: skip link, header, the single `<main id="main">` focus target,
 *  footer, and the app-wide screen-reader live regions (`useAnnounce`). */
export function Shell({ children, snapshot }: { children: ReactNode; snapshot: CmsSnapshot | null }) {
  return (
    <LiveRegionProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-canvas focus:px-4 focus:py-2 focus:text-body focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      {import.meta.env.DEV && import.meta.env.VITE_LOCAL_COMMERCE_PREVIEW === 'true' ? (
        <div className="border-b border-line bg-yellow px-4 py-2 text-center text-label text-ink">
          <strong>Local sample data</strong> · Simulated payments and sample delivery rates.{' '}
          <a href="http://127.0.0.1:5192/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Open admin preview</a>
        </div>
      ) : null}
      <Navbar snapshot={snapshot} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <Footer snapshot={snapshot} />
    </LiveRegionProvider>
  )
}
