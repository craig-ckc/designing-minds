import type { ReactNode } from 'react'
import { Disclosure } from './disclosure'

/** Product-page detail section: a native, JS-free `Disclosure`. */
export function DetailDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return <Disclosure title={title}>{children}</Disclosure>
}
