import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'
import { Pill } from '../components/Badge'

export function SubjectsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const subjects = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...snapshot.subjects]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((s) => !q || `${s.name} ${s.slug} ${s.shortLabel}`.toLowerCase().includes(q))
  }, [snapshot.subjects, query])

  return (
    <CollectionListLayout title="Subjects" count={subjects.length} query={query} onQueryChange={setQuery} newLabel="New subject" newTo="/subjects/new">
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th className="w-full">Name</Th>
            <Th>Slug</Th>
            <Th>Short label</Th>
            <Th>Order</Th>
            <Th>Visibility</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {subjects.map((subject) => (
            <tr key={subject.id} className="cursor-pointer hover:bg-surface-alt">
              <Td>
                <Link to={`/subjects/${subject.id}`} className="font-medium underline-offset-4 hover:underline">
                  {subject.name}
                </Link>
              </Td>
              <Td className="text-muted">{subject.slug}</Td>
              <Td>{subject.shortLabel}</Td>
              <Td>{subject.sortOrder}</Td>
              <Td>
                <Pill tone={subject.visible ? 'solid' : 'muted'}>{subject.visible ? 'Visible' : 'Hidden'}</Pill>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollectionListLayout>
  )
}
