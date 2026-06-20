import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  defaultProductFilters,
  filterProducts,
  formatCurrency,
  type CmsSnapshot,
  type ProductFilterState,
} from '@designing-minds/cms'
import { Chip, Icon, PageHeader, SelectField, Td, TableWrap, Th } from '../components/ui'
import { FIELD } from '../components/tokens'

/* Monochrome product-status pill — varies by fill / outline, never colour. */
function ProductStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    featured: 'border-ink bg-ink text-white',
    fresh: 'border-line-strong bg-surface text-ink',
    evergreen: 'border-line bg-surface-alt text-muted',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium uppercase tracking-[0.06em] ${
        styles[status] ?? styles.fresh
      }`}
    >
      {status}
    </span>
  )
}

export function ProductsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ProductFilterState>(defaultProductFilters)
  const deferredQuery = useDeferredValue(filters.query)
  const visible = filterProducts(snapshot.products, { ...filters, query: deferredQuery })

  const update = (patch: Partial<ProductFilterState>) => setFilters((current) => ({ ...current, ...patch }))

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${snapshot.stats.productCount} CAPS-aligned resources. Click a row to edit.`}
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="grid gap-2 text-[0.92rem] font-medium">
            Search
            <span className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
                <Icon name="search" />
              </span>
              <input
                className={`${FIELD} pl-9`}
                value={filters.query}
                onChange={(event) => update({ query: event.target.value })}
                placeholder="Title, subject…"
              />
            </span>
          </label>
        </div>
        <div className="min-w-[140px]">
          <SelectField
            label="Grade"
            value={filters.grade}
            options={['All grades', ...snapshot.filters.grades]}
            onChange={(value) => update({ grade: value })}
          />
        </div>
        <div className="min-w-[130px]">
          <SelectField
            label="Term"
            value={filters.term}
            options={['All terms', ...snapshot.filters.terms]}
            onChange={(value) => update({ term: value })}
          />
        </div>
        <div className="min-w-[160px]">
          <SelectField
            label="Subject"
            value={filters.subject}
            options={['All subjects', ...snapshot.filters.subjects]}
            onChange={(value) => update({ subject: value })}
          />
        </div>
        <div className="min-w-[140px]">
          <SelectField
            label="Type"
            value={filters.type}
            options={['All formats', ...snapshot.filters.productTypes]}
            onChange={(value) => update({ type: value })}
          />
        </div>
        <button
          type="button"
          onClick={() => setFilters(defaultProductFilters)}
          className="ml-auto min-h-[46px] text-[0.9rem] font-medium text-ink underline underline-offset-4 hover:opacity-70"
        >
          Reset filters
        </button>
      </div>

      <p className="mb-3 text-[0.9rem] text-muted">{visible.length} results</p>

      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Title</Th>
              <Th>Grade</Th>
              <Th>Term</Th>
              <Th>Subject</Th>
              <Th>Type</Th>
              <Th className="text-right">Price</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => (
              <tr
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-alt"
              >
                <Td className="max-w-[320px] whitespace-normal font-medium">{product.title}</Td>
                <Td>
                  <Chip>{product.grade}</Chip>
                </Td>
                <Td className="text-muted">{product.term}</Td>
                <Td className="text-muted">{product.primarySubject}</Td>
                <Td className="text-muted">{product.type}</Td>
                <Td className="text-right font-medium tabular-nums">{formatCurrency(product.priceZar)}</Td>
                <Td>
                  <ProductStatusBadge status={product.status} />
                </Td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <Td className="text-muted">No products match your filters.</Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableWrap>
    </>
  )
}
