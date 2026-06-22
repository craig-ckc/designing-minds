import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { PageHeader, Td, TableWrap, Th } from '../components/ui'
import { Pill } from '../components/Badge'
import { SOLID_BTN } from '../components/tokens'

export function TestimonialsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const items = [...snapshot.testimonials].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="Testimonials"
        description="Reusable customer quotes and outcomes shown across the site."
        actions={
          <Link to="/testimonials/new" className={SOLID_BTN}>
            New testimonial
          </Link>
        }
      />
      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Customer</Th>
              <Th>Quote</Th>
              <Th>Grade</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((t) => (
              <tr key={t.id} className="hover:bg-surface-alt">
                <Td>
                  <Link to={`/testimonials/${t.id}`} className="font-medium underline underline-offset-4">
                    {t.customerName}
                  </Link>
                </Td>
                <Td className="max-w-[420px] truncate text-muted">“{t.quote}”</Td>
                <Td>{t.learnerGrade ?? '—'}</Td>
                <Td>
                  <span className="flex gap-1.5">
                    <Pill tone={t.published ? 'solid' : 'muted'}>{t.published ? 'Published' : 'Draft'}</Pill>
                    {t.featured ? <Pill tone="outline">Featured</Pill> : null}
                  </span>
                </Td>
                <Td>
                  <Link to={`/testimonials/${t.id}`} className="text-[0.88rem] underline underline-offset-4">
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
