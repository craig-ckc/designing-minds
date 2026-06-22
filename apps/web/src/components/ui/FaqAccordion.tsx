import { Accordion } from '@base-ui/react/accordion'
import type { Faq } from '@designing-minds/cms'
import { Icon } from './Icon'

/** FAQ list as an accessible Base UI accordion. */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) {
    return <p className="text-muted">No questions have been added yet.</p>
  }
  return (
    <Accordion.Root className="border-t border-line">
      {faqs.map((faq) => (
        <Accordion.Item key={faq.id} className="border-b border-line">
          <Accordion.Header className="m-0">
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-[1.02rem] font-medium hover:opacity-80">
              {faq.question}
              <span className="h-4 w-4 flex-none text-muted transition-transform group-data-[panel-open]:rotate-180">
                <Icon name="chevron" />
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
