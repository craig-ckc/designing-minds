import type { CmsSnapshot } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Section } from '../ui/section'
import { ResourceStack } from '../ui/resource-stack'
import { CtaBanner } from './cta-banner'

export function BundleCtaSection({ snapshot }: { snapshot?: CmsSnapshot | null }) {
  return <Section><CtaBanner.Root>
    <CtaBanner.Content>
      <CtaBanner.Title>Cover a whole term or the full year in one purchase</CtaBanner.Title>
      <CtaBanner.Description>Bundles group the available tests and memorandums for a grade into one discounted, once-off purchase.</CtaBanner.Description>
      <CtaBanner.Actions><Button to="/packages" variant="solid-light">Browse bundles</Button><Button to="/about" variant="text" className="text-on-primary hover:text-on-primary">Learn more</Button></CtaBanner.Actions>
    </CtaBanner.Content>
    <CtaBanner.Artwork><ResourceStack snapshot={snapshot} /></CtaBanner.Artwork>
  </CtaBanner.Root></Section>
}
