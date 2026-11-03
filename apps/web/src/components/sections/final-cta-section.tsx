import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

export function FinalCtaSection() {
  return (
    <Section>
      <CtaBanner.Root tone="neutral" layout="inline">
        <CtaBanner.Content>
          <CtaBanner.Title>Ready to help your child practise?</CtaBanner.Title>
          <CtaBanner.Description>Browse CAPS-aligned resources by grade, or get a term bundle and save.</CtaBanner.Description>
        </CtaBanner.Content>
        <CtaBanner.Actions>
          <Button to="/shop" variant="solid">See all resources <Icon name="arrow" size={16} /></Button>
          <Button to="/packages" variant="outline">See all bundles</Button>
        </CtaBanner.Actions>
      </CtaBanner.Root>
    </Section>
  )
}
