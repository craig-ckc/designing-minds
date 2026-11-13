import { Button } from '../ui/button'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

/**
 * The closing brand-pink band (Figma `CtaSection / Style=Brand`): white title and
 * description, one solid-light button with no icon, and the painted pastel binders
 * rising out of the right-hand side. Home, About, Grades and Help only change the copy.
 */
export function FinalCtaSection({
  id = 'start-shopping',
  title = 'Ready to help your child practise?',
  description = 'Browse CAPS-aligned resources by grade, or get a term bundle and save.',
  actionLabel = 'View bundles',
  actionTo = '/packages',
}: {
  id?: string
  title?: string
  description?: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <Section id={id}>
      <CtaBanner.Root>
        <CtaBanner.Content>
          <CtaBanner.Title>{title}</CtaBanner.Title>
          <CtaBanner.Description>{description}</CtaBanner.Description>
          <CtaBanner.Actions>
            <Button to={actionTo} variant="solid-light">{actionLabel}</Button>
          </CtaBanner.Actions>
        </CtaBanner.Content>
        <CtaBanner.Artwork>
          <img src="/images/paintings/cta-practice-binders.avif" alt="" width={888} height={570} loading="lazy" decoding="async" />
        </CtaBanner.Artwork>
      </CtaBanner.Root>
    </Section>
  )
}
