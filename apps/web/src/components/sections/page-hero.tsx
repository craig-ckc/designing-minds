import { type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Container } from '../ui/container'
import { Icon } from '../ui/icon'

/**
 * Page hero (Figma `AboutHeroSection Variant2`), shared by About and Grades: a cream band with a
 * hairline bottom border holding the H1 on the left and the lead plus one primary button on the
 * right, then a full-bleed decorative painting with no radius. Phones stack heading, lead, button,
 * then a shorter painting.
 */
export function PageHero({
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
  /** Decorative 4:3 painting, 1280×960, cropped to the band with object-cover. */
  image: string
}) {
  return (
    <section>
      <div className="border-b border-line bg-surface-alt">
        <Container className="grid gap-4 py-10 sm:py-12 lg:grid-cols-2 lg:gap-6 lg:py-16">
          <h1 className="max-w-narrow">{title}</h1>
          <div className="max-w-narrow lg:pt-4">
            <p className="lead">{lead}</p>
            <Button to={actionTo} variant="solid" className="mt-6 lg:mt-8">
              {actionLabel} <Icon name="arrow" size={16} />
            </Button>
          </div>
        </Container>
      </div>
      <img
        src={image}
        alt=""
        width={1280}
        height={960}
        fetchPriority="high"
        className="block h-60 w-full object-cover sm:h-[22.5rem] lg:h-[30rem]"
      />
    </section>
  )
}
