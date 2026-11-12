import { type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'

/** Page hero: copy and one primary button beside a decorative painting (cream band). */
export function SplitHero({
  title,
  lead,
  actionLabel,
  actionTo,
  image,
}: {
  title: string
  lead: ReactNode
  actionLabel: string
  actionTo: string
  /** 4:3 painting, 1280×960. Decorative. */
  image: string
}) {
  return (
    <Section className="split-hero" containerClassName="split-hero__layout" spacing="tight">
      <div className="split-hero__copy">
        <h1>{title}</h1>
        <p className="mt-4 lead">{lead}</p>
        <div className="mt-6">
          <Button to={actionTo} variant="solid">
            {actionLabel} <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>
      <img className="split-hero__art" src={image} alt="" width={1280} height={960} fetchPriority="high" />
    </Section>
  )
}
