import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { PageHeader, Td, TableWrap, Th } from '../components/ui'
import { Pill } from '../components/Badge'
import { SOLID_BTN } from '../components/tokens'

export function FaqsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const faqs = [...snapshot.faqs].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="FAQs"
        description="Reusable questions and answers shown across pages, products, and subjects."
        actions={
          <Link to="/faqs/new" className={SOLID_BTN}>
            New FAQ
          </Link>
        }
      />
      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Question</Th>
              <Th>Category</Th>
              <Th>Order</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {faqs.map((faq) => (
              <tr key={faq.id} className="hover:bg-surface-alt">
                <Td className="whitespace-normal">
                  <Link to={`/faqs/${faq.id}`} className="font-medium underline underline-offset-4">
                    {faq.question}
                  </Link>
                </Td>
                <Td>{faq.category}</Td>
                <Td>{faq.sortOrder}</Td>
                <Td>
                  <Pill tone={faq.published ? 'solid' : 'muted'}>{faq.published ? 'Published' : 'Draft'}</Pill>
                </Td>
                <Td>
                  <Link to={`/faqs/${faq.id}`} className="text-[0.88rem] underline underline-offset-4">
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  )
}
