import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'
import { Pill } from '../components/Badge'

export function TestimonialsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...snapshot.testimonials]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((t) => !q || `${t.customerName} ${t.quote} ${t.context}`.toLowerCase().includes(q))
  }, [snapshot.testimonials, query])

  return (
    <CollectionListLayout title="Testimonials" count={items.length} query={query} onQueryChange={setQuery} newLabel="New testimonial" newTo="/testimonials/new">
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th>Customer</Th>
            <Th className="w-full">Quote</Th>
            <Th>Grade</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((t) => (
            <tr key={t.id} className="cursor-pointer hover:bg-surface-alt">
              <Td>
                <Link to={`/testimonials/${t.id}`} className="font-medium underline-offset-4 hover:underline">
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
            </tr>
          ))}
        </tbody>
      </table>
    </CollectionListLayout>
  )
}
