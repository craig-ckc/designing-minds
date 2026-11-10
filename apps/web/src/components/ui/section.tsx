import { type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'
import { Card } from './card'
import { Container } from './container'

type SectionSpacing = 'default' | 'tight' | 'none'

const spacingClass: Record<SectionSpacing, string> = {
  default: 'section',
  tight: 'section-tight',
  none: '',
}

export function Section({
  children,
  className,
  containerClassName,
  spacing = 'default',
  ...rest
}: {
  children: ReactNode
  className?: string
  containerClassName?: string
  spacing?: SectionSpacing
} & Omit<ComponentPropsWithRef<'section'>, 'className' | 'children'>) {
  return (
    <section {...rest} className={cn(spacingClass[spacing], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}

export function SectionNotice({ title, body }: { title: string; body: string }) {
  return (
    <Card variant="surface" pad="lg" shadow="soft" className="text-center">
      <h3>{title}</h3>
      <p className="mx-auto mt-3 max-w-narrow text-muted">{body}</p>
    </Card>
  )
}
