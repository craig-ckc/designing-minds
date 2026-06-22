import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { PageHeader, Td, TableWrap, Th } from '../components/ui'
import { Pill } from '../components/Badge'
import { SOLID_BTN } from '../components/tokens'

export function SubjectsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const subjects = [...snapshot.subjects].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="Subjects"
        description="Learning subjects used to classify and describe products."
        actions={
          <Link to="/subjects/new" className={SOLID_BTN}>
            New subject
          </Link>
        }
      />
      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Short label</Th>
              <Th>Order</Th>
              <Th>Visibility</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {subjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-surface-alt">
                <Td>
                  <Link to={`/subjects/${subject.id}`} className="font-medium underline underline-offset-4">
                    {subject.name}
                  </Link>
                </Td>
                <Td className="text-muted">{subject.slug}</Td>
                <Td>{subject.shortLabel}</Td>
                <Td>{subject.sortOrder}</Td>
                <Td>
                  <Pill tone={subject.visible ? 'solid' : 'muted'}>{subject.visible ? 'Visible' : 'Hidden'}</Pill>
                </Td>
                <Td>
                  <Link to={`/subjects/${subject.id}`} className="text-[0.88rem] underline underline-offset-4">
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
