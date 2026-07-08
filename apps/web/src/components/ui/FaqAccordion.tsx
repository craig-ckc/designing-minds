import { Accordion } from '@base-ui/react/accordion'
import type { Faq } from '@designing-minds/cms'
import { Icon } from './Icon'

/** FAQ list as an accessible Base UI accordion. */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) {
    return <p className="text-muted">No questions have been added yet.</p>
  }
  return (
    <Accordion.Root className="grid gap-3">
      {faqs.map((faq) => (
        <Accordion.Item
          key={faq.id}
          className="overflow-hidden rounded-xl border border-line bg-surface px-5 shadow-soft transition-colors data-[panel-open]:border-primary/40"
        >
          <Accordion.Header className="m-0">
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-[1.05rem] font-bold hover:text-primary">
              {faq.question}
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-sunk text-ink-soft transition-transform group-data-[panel-open]:rotate-180">
                <span className="h-4 w-4">
                  <Icon name="chevron" />
                </span>
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-muted transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
            <p className="pb-4 pr-8">{faq.answer}</p>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
