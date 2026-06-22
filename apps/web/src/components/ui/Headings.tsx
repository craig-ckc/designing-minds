import { type ReactNode } from 'react'
import { Container } from './Container'
import { Eyebrow } from './Eyebrow'

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

/** In-page section heading (Eyebrow + h2 + optional lead). */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  center,
}: {
  eyebrow?: string
  title: string
  lead?: string
  center?: boolean
}) {
  return (
    <div className={`mb-9 max-w-[640px] lg:mb-12 ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2>{title}</h2>
      {lead ? <p className="mt-4 lead">{lead}</p> : null}
    </div>
  )
}
