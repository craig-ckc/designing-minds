import { type ReactNode } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { Navbar } from './navbar'
import { Footer } from './footer'

export function Shell({ children, snapshot }: { children: ReactNode; snapshot: CmsSnapshot | null }) {
  return (
    <>
      <Navbar snapshot={snapshot} />
      <main className="flex-1">{children}</main>
      <Footer snapshot={snapshot} />
    </>
  )
}
