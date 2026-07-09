import { cn } from '@designing-minds/utils'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Polaroid } from '../ui/polaroid'
import { Section } from '../ui/section'

/** A full-bleed strip of photos along the bottom of the hero. Trailing frames
 *  drop away on smaller screens; each cell flexes to fill the width. */
const PHOTOS: { rotate: string; hide?: string }[] = [
  { rotate: '-3deg' },
  { rotate: '2deg' },
  { rotate: '-2deg' },
  { rotate: '3deg', hide: 'hidden sm:block' },
  { rotate: '-2deg', hide: 'hidden lg:block' },
  { rotate: '2deg', hide: 'hidden lg:block' },
]

export function AboutHeroSection() {
  return (
    <Section className="overflow-hidden" containerClassName="text-center" spacing="tight">
      <div className="mx-auto max-w-readable">
        <h1>Helping learners thrive, one test at a time</h1>
        <p className="mx-auto mt-6 max-w-prose lead">
          We believe learning should be simple, accessible, and stress-free. Designing Minds makes affordable,
          CAPS-aligned practice tests that help learners prepare with confidence — and empower parents to guide
          learning at home.
        </p>
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/shop" variant="solid">
            Browse resources
            <Icon name="arrow" size={16} />
          </Button>
          <Button to="/contact" variant="soft">
            Get in touch
          </Button>
        </div>
      </div>

      <div className="relative left-1/2 z-0 -ml-[50vw] mt-[-2.5rem] w-screen sm:mt-[-3.25rem]">
        <div className="mx-auto flex max-w-[1500px] items-end gap-2 px-4 sm:gap-4 sm:px-8">
          {PHOTOS.map((photo, i) => (
            <div key={i} className={cn('flex-1', photo.hide)}>
              <Polaroid rotate={photo.rotate} ratio="4 / 5" className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
