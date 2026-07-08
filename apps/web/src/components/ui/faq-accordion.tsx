import { Accordion } from '@base-ui/react/accordion'
import type { Faq } from '@designing-minds/cms'
import { Icon } from './icon'

/**
 * FAQ list as an accessible Base UI accordion. Deliberately flat: hairline
 * dividers instead of per-item cards, and a leading marker that is a `+` when
 * closed and rotates 45° into a `×` when open — no right-hand chevron.
 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) {
    return <p className="text-muted">No questions have been added yet.</p>
  }
  return (
    <Accordion.Root multiple={false} defaultValue={[]} className="border-t border-line">
      {faqs.map((faq) => (
        <Accordion.Item key={faq.id} value={faq.id} className="border-b border-line">
          <Accordion.Header className="m-0">
            <Accordion.Trigger className="group flex w-full items-start gap-4 py-5 text-left">
              <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center text-primary transition-[transform,color] duration-200 group-data-[panel-open]:rotate-45 group-data-[panel-open]:text-ink">
                <Icon name="plus" size={22} />
              </span>
              <span className="flex-1 text-body-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary">
                {faq.question}
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
            <p className="pb-5 pl-10 pr-4 text-body leading-[1.55] text-muted">{faq.answer}</p>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
