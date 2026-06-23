import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'
import { Pill } from '../components/Badge'

export function FaqsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const faqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...snapshot.faqs]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((f) => !q || `${f.question} ${f.category}`.toLowerCase().includes(q))
  }, [snapshot.faqs, query])

  return (
    <CollectionListLayout title="FAQs" count={faqs.length} query={query} onQueryChange={setQuery} newLabel="New FAQ" newTo="/faqs/new">
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th className="w-full">Question</Th>
            <Th>Category</Th>
            <Th>Order</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {faqs.map((faq) => (
            <tr key={faq.id} className="cursor-pointer hover:bg-surface-alt">
              <Td className="whitespace-normal">
                <Link to={`/faqs/${faq.id}`} className="font-medium underline-offset-4 hover:underline">
                  {faq.question}
                </Link>
              </Td>
              <Td>{faq.category}</Td>
              <Td>{faq.sortOrder}</Td>
              <Td>
                <Pill tone={faq.published ? 'solid' : 'muted'}>{faq.published ? 'Published' : 'Draft'}</Pill>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollectionListLayout>
  )
}
