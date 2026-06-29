import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'
import { formatCurrency, type OrderStatus, type PaymentStatus, type ProductKind } from '@designing-minds/cms'
import type { AdminCollection, AdminRecord, ListColumn } from '../../cms/types'
import { getPath } from '../../cms/record'
import { KindPill, OrderStatusPill, PaymentStatusPill, Pill } from '../Badge'
import { ScrollArea } from '../primitives'

/** Dense, full-width record table driven by collection.listColumns. */
export function RecordTable({
  collection,
  records,
  selectedId,
  onSelect,
}: {
  collection: AdminCollection
  records: AdminRecord[]
  selectedId?: string | null
  onSelect: (id: string) => void
}) {
  const columns = collection.listColumns

  return (
    <ScrollArea orientation="both" className="min-h-0 flex-1">
      <table className="w-full border-collapse text-[0.85rem]">
        <thead className="sticky top-0 z-10 bg-surface-alt">
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={cn(
                  'whitespace-nowrap px-3 py-2 text-left text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted',
                  column.align === 'right' && 'text-right',
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              onClick={() => onSelect(record.id)}
              className={cn(
                'cursor-pointer border-b border-line hover:bg-surface-alt',
                selectedId === record.id && 'bg-surface-alt',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{ maxWidth: column.width }}
                  className={cn(
                    'px-3 py-2.5 align-middle',
                    column.align === 'right' && 'text-right',
                    column.key === collection.titleField && 'font-medium',
                  )}
                >
                  {renderCell(record, column)}
                </td>
              ))}
            </tr>
          ))}
          {records.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-muted">
                No records.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </ScrollArea>
  )
}

function renderCell(record: AdminRecord, column: ListColumn): ReactNode {
  const value = getPath(record, column.key)
  const text = (content: string) => <span className="block truncate">{content}</span>

  switch (column.valueType) {
    case 'currency':
      return text(formatCurrency(Number(value ?? 0)))
    case 'date':
      return text(String(value ?? '').slice(0, 10))
    case 'kind':
      return value ? <KindPill kind={value as ProductKind} /> : null
    case 'publish': {
      const on = Boolean(value)
      return (
        <span className="flex gap-1.5">
          <Pill tone={on ? 'solid' : 'muted'}>{on ? 'Published' : 'Draft'}</Pill>
          {record.featured ? <Pill tone="outline">Featured</Pill> : null}
        </span>
      )
    }
    case 'visibility': {
      const on = Boolean(value)
      return <Pill tone={on ? 'solid' : 'muted'}>{on ? 'Visible' : 'Hidden'}</Pill>
    }
    case 'orderStatus':
      return value ? <OrderStatusPill status={value as OrderStatus} /> : null
    case 'paymentStatus':
      return value ? <PaymentStatusPill status={value as PaymentStatus} /> : null
    default:
      return text(value == null ? '' : String(value))
  }
}
