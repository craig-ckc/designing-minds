import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { Field, PageHeader, SelectField, Td, TableWrap, Th } from '../components/ui'
import { KindPill, Pill } from '../components/Badge'
import { FIELD, SOLID_BTN } from '../components/tokens'

export function ProductsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All kinds')
  const deferred = useDeferredValue(query)

  const visible = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    return snapshot.products.filter((p) => {
      if (kind !== 'All kinds' && p.productKind !== kind) return false
      if (!q) return true
      return `${p.title} ${p.grade} ${p.term}`.toLowerCase().includes(q)
    })
  }, [snapshot.products, deferred, kind])

  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="Products"
        description="The catalogue: individual resources, bundles, and access plans."
        actions={
          <Link to="/products/new" className={SOLID_BTN}>
            New product
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Field label="Search">
            <input className={FIELD} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
          </Field>
        </div>
        <div className="min-w-[180px]">
          <SelectField
            label="Kind"
            value={kind}
            options={['All kinds', ...snapshot.valueLists.productKinds]}
            onChange={setKind}
          />
        </div>
      </div>

      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Title</Th>
              <Th>Kind</Th>
              <Th>Grade</Th>
              <Th>Term</Th>
              <Th>Format</Th>
              <Th className="text-right">Price</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((product) => (
              <tr key={product.id} className="hover:bg-surface-alt">
                <Td className="whitespace-normal">
                  <Link to={`/products/${product.id}`} className="font-medium underline underline-offset-4">
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
                <Td>
                  <Link to={`/products/${product.id}`} className="text-[0.88rem] underline underline-offset-4">
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <Td className="text-muted">No products match.</Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableWrap>
    </>
  )
}
