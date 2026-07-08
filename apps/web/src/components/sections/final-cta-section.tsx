import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import { Card } from '../ui/card'

export function FinalCtaSection() {
  return (
    <Section>
      <Card variant="surface" pad="lg" className="text-center lg:p-16">
        <div>
          <h2 className="mx-auto max-w-[18ch]">Ready to help your child practise?</h2>
          <p className="mx-auto mt-4 max-w-narrow lead">
            Browse CAPS-aligned resources by grade, or grab a term bundle and save.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/shop" variant="solid">
              See all resources
              <Icon name="arrow" size={16} />
            </Button>
            <Button to="/packages" variant="soft">
              See bundles and plans
            </Button>
          </div>
        </div>
      </Card>
    </Section>
  )
}
