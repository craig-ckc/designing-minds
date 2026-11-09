import type { CmsSnapshot } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { ResourceStack } from '../ui/resource-stack'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

/**
 * The homepage's closing peak: the brand-pink band with real resource covers.
 * Text is ink, not white — white on the logo pink measures ~3.2:1, ink ~5.4:1.
 */
export function FinalCtaSection({ snapshot }: { snapshot?: CmsSnapshot | null }) {
  return (
    <Section id="start-shopping">
      <CtaBanner.Root className="text-ink">
        <CtaBanner.Content>
          <CtaBanner.Title>Ready to help your child practise?</CtaBanner.Title>
          <CtaBanner.Description>Browse CAPS-aligned resources by grade, or get a term bundle and save.</CtaBanner.Description>
          <CtaBanner.Actions>
            <Button to="/shop" variant="solid-light">See all resources <Icon name="arrow" size={16} /></Button>
            <Button to="/packages" variant="text" className="px-0 text-ink hover:text-ink hover:underline hover:underline-offset-4">See all bundles</Button>
          </CtaBanner.Actions>
        </CtaBanner.Content>
        <CtaBanner.Artwork><ResourceStack snapshot={snapshot} /></CtaBanner.Artwork>
      </CtaBanner.Root>
    </Section>
  )
}
