import { useState } from 'react'
import { Button } from '../ui/button'
import { Icon, type IconName } from '../ui/icon'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'
import getToKnowItems from '../../content/home/get-to-know-items.json'

const items = getToKnowItems as { icon: IconName; title: string; body: string }[]

export function GetToKnowSection() {
  const [open, setOpen] = useState(0)
  return (
    <Section>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
        <h2 className="max-w-[12ch]">Get to know Designing Minds</h2>
        <div>
          <p className="lead max-w-[46ch]">
            Replace scattered worksheets and past papers with one tidy library of CAPS-aligned resources built for
            South African classrooms.
          </p>
          <Button to="/about" variant="text" className="mt-3">
            See how it works
            <span className="h-4 w-4">
              <Icon name="arrow" />
            </span>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:items-center">
        <div>
          {items.map((item, i) => {
            const isOpen = i === open
            return (
              <div key={item.title} className="border-b border-line last:border-0">
                <Button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="flex w-full items-center gap-3.5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`grid h-10 w-10 flex-none place-items-center rounded-md transition-colors ${
                      isOpen ? 'bg-primary text-on-primary' : 'bg-surface-sunk text-ink-soft'
                    }`}
                  >
                    <span className="h-5 w-5">
                      <Icon name={item.icon} />
                    </span>
                  </span>
                  <span className="flex-1 text-body-lg font-bold">{item.title}</span>
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-pill border border-line text-ink-soft">
                    <span className="h-3.5 w-3.5">
                      <Icon name="arrow" />
                    </span>
                  </span>
                </Button>
                {isOpen ? <p className="pb-5 pl-[54px] pr-4 text-body text-muted">{item.body}</p> : null}
              </div>
            )
          })}
        </div>
        <div>
          <Placeholder ratio="4 / 3" className="bg-surface" />
        </div>
      </div>
    </Section>
  )
}
