import type { ReactNode } from 'react'
import { Disclosure } from './disclosure'

/** Product-page detail section: a native, JS-free `Disclosure`. */
export function DetailDisclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return <Disclosure title={title} open={defaultOpen || undefined}>{children}</Disclosure>
}
