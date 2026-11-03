import { type ReactNode } from 'react'
import { Container, type ContainerWidth } from './container'

/** Top-of-page heading block for browse, static, and functional pages. */
export function PageHeader({
  title,
  lead,
  children,
  width = 'page',
}: {
  title: string
  lead?: string
  children?: ReactNode
  width?: ContainerWidth
}) {
  return (
    <section className="section-tight border-b border-line">
      <Container width={width}>
        <div className="max-w-prose">
          <h1 className="text-page-title">{title}</h1>
          {lead ? <p className="mt-3 lead">{lead}</p> : null}
        </div>
        {children}
      </Container>
    </section>
  )
}
