import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'
import { KindPill, Pill } from '../components/Badge'

const FILTER_SELECT =
  'min-h-[42px] rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] focus:outline focus:outline-2 focus:outline-ink focus:-outline-offset-1'

export function ProductsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All kinds')
  const deferred = useDeferredValue(query)

  const visible = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    return snapshot.products.filter((p) => {
      if (kind !== 'All kinds' && p.productKind !== kind) return false
      if (!q) return true
      return `${p.title} ${p.grade} ${p.term} ${p.resourceFormat}`.toLowerCase().includes(q)
    })
  }, [snapshot.products, deferred, kind])

  return (
    <CollectionListLayout
      title="Products"
      count={visible.length}
      query={query}
      onQueryChange={setQuery}
      newLabel="New product"
      newTo="/products/new"
      filters={
        <select className={FILTER_SELECT} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by product kind">
          {['All kinds', ...snapshot.valueLists.productKinds].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      }
    >
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th className="w-full">Title</Th>
            <Th>Kind</Th>
            <Th>Grade</Th>
            <Th>Term</Th>
            <Th>Format</Th>
            <Th className="text-right">Price</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {visible.map((product) => (
            <tr key={product.id} className="cursor-pointer hover:bg-surface-alt">
              <Td className="whitespace-normal">
                <Link to={`/products/${product.id}`} className="font-medium underline-offset-4 hover:underline">
                  {product.title}
                </Link>
              </Td>
              <Td>
                <KindPill kind={product.productKind} />
              </Td>
              <Td>{product.grade}</Td>
              <Td>{product.term}</Td>
              <Td>{product.resourceFormat}</Td>
              <Td className="text-right">{formatCurrency(product.priceZar)}</Td>
              <Td>
                <span className="flex gap-1.5">
                  <Pill tone={product.published ? 'solid' : 'muted'}>{product.published ? 'Published' : 'Draft'}</Pill>
                  {product.featured ? <Pill tone="outline">Featured</Pill> : null}
                </span>
              </Td>
            </tr>
          ))}
          {visible.length === 0 ? (
            <tr>
              <Td className="text-muted" colSpan={7}>
                No products match.
              </Td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </CollectionListLayout>
  )
}
