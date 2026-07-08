import { type ReactNode } from 'react'
import { Container } from './container'

type SectionSpacing = 'default' | 'tight' | 'none'

const spacingClass: Record<SectionSpacing, string> = {
  default: 'section',
  tight: 'section-tight',
  none: '',
}

export function Section({
  children,
  className = '',
  containerClassName = '',
  spacing = 'default',
  id,
}: {
  children: ReactNode
  className?: string
  containerClassName?: string
  spacing?: SectionSpacing
  id?: string
}) {
  return (
    <section id={id} className={[spacingClass[spacing], className].filter(Boolean).join(' ')}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}

export function SectionNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
      <h3>{title}</h3>
      <p className="mx-auto mt-3 max-w-[560px] text-muted">{body}</p>
    </div>
  )
}
