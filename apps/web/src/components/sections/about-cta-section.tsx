import type { CmsSnapshot } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Section } from '../ui/section'
import { ResourceStack } from '../ui/resource-stack'
import { CtaBanner } from './cta-banner'

export function AboutCtaSection({ snapshot }: { snapshot?: CmsSnapshot | null }) {
  return <Section><CtaBanner.Root>
    <CtaBanner.Content>
      <CtaBanner.Title>Ready to support your child’s learning journey?</CtaBanner.Title>
      <CtaBanner.Description>Explore our printable CAPS-aligned tests and learning resources, made to build confidence, reduce stress, and make learning fun.</CtaBanner.Description>
      <CtaBanner.Actions><Button to="/shop" variant="solid-light">Browse Tests</Button></CtaBanner.Actions>
    </CtaBanner.Content>
    <CtaBanner.Artwork><ResourceStack snapshot={snapshot} /></CtaBanner.Artwork>
  </CtaBanner.Root></Section>
}
