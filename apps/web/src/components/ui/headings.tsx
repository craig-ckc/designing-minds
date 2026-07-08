import { type ReactNode } from 'react'
import { Container } from './container'
import { Eyebrow } from './eyebrow'

/** Top-of-page heading block for browse, static, and functional pages. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  children?: ReactNode
}) {
  return (
    <section className="section-tight border-b border-line">
      <Container>
        <div className="max-w-[680px]">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1>{title}</h1>
          {lead ? <p className="mt-4 lead">{lead}</p> : null}
        </div>
        {children}
      </Container>
    </section>
  )
}
