import { type ReactNode } from 'react'
import { Container } from './container'

/** Top-of-page heading block for browse, static, and functional pages. */
export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children?: ReactNode
}) {
  return (
    <section className="section-tight border-b border-line">
      <Container>
        <div className="max-w-prose">
          <h1>{title}</h1>
          {lead ? <p className="mt-4 lead">{lead}</p> : null}
        </div>
        {children}
      </Container>
    </section>
  )
}
