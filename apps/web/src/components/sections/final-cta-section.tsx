import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

/**
 * The closing brand-pink band with the painted practice booklets. Text is ink,
 * not white: white on the logo pink measures ~3.2:1, ink ~5.4:1. One solid-light
 * button so the action never sits pink on pink.
 */
export function FinalCtaSection({
  id = 'start-shopping',
  title = 'Ready to help your child practise?',
  description = 'Browse CAPS-aligned resources by grade, or get a term bundle and save.',
  actionLabel = 'See all resources',
  actionTo = '/shop',
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
            <Button to={actionTo} variant="solid-light">{actionLabel} <Icon name="arrow" size={16} /></Button>
          </CtaBanner.Actions>
        </CtaBanner.Content>
        <CtaBanner.Artwork>
          <img src="/images/paintings/cta-practice-booklets.avif" alt="" width={907} height={733} loading="lazy" decoding="async" />
        </CtaBanner.Artwork>
      </CtaBanner.Root>
    </Section>
  )
}
