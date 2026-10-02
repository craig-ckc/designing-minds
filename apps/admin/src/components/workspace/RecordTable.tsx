import { type ReactNode } from 'react'
import { formatCurrency, type OrderStatus, type PaymentStatus } from '@designing-minds/cms'
import type { AdminCollection, AdminRecord, ListColumn } from '../../cms/types'
import { getPath } from '../../cms/record'
import {
  isLive,
  publishState,
  publishStateHint,
  PUBLISH_STATE_LABEL,
  PUBLISH_STATE_TONE,
  type SiteStatus,
} from '../../cms/publish-state'
import { useSite } from '../../lib/site-status'
import { OrderStatusPill, PaymentStatusPill, Pill } from '../Badge'
import { Checkbox, ScrollArea } from '../primitives'
import { cn, TD, TH } from '../../design'

/**
 * Dense, full-width record table driven by collection.listColumns. When
 * `selection` is provided the table shows a checkbox column and row clicks
 * toggle selection instead of opening the record.
 *
 * `columns` narrows it to a subset — that's how the split view's record list
 * is built. Reusing this component rather than styling a lookalike list is the
 * point: the narrow pane *is* the table, just with one column, so row height,
 * padding, hover, selection and truncation can't drift apart.
 */
export function RecordTable({
  collection,
  records,
  columns: columnsOverride,
  fixedLayout,
  emptyMessage = 'No records.',
  selectedId,
  onSelect,
  selection,
}: {
  collection: AdminCollection
  records: AdminRecord[]
  /** Render these columns instead of the collection's full list. */
  columns?: ListColumn[]
  /** Size columns by declaration, not content — needed for cells to truncate. */
  fixedLayout?: boolean
  emptyMessage?: string
  selectedId?: string | null
  onSelect: (id: string) => void
  selection?: {
    selectedIds: ReadonlySet<string>
    onToggle: (id: string) => void
    onToggleAll: () => void
  }
}) {
  const columns = columnsOverride ?? collection.listColumns
  const site = useSite()
  const allVisibleSelected = records.length > 0 && records.every((record) => selection?.selectedIds.has(record.id))

  return (
    <ScrollArea orientation={fixedLayout ? 'vertical' : 'both'} className="min-h-0 flex-1">
      <table className={cn('w-full border-collapse text-ui', fixedLayout && 'table-fixed')}>
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-line">
            {selection ? (
              <th className="w-8 px-2.5 py-1.5">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={selection.onToggleAll}
                  aria-label="Select all visible records"
                />
              </th>
            ) : null}
            {columns.map((column) => (
              <th
                key={column.key}
                style={columnStyle(column)}
                className={cn(TH, column.align === 'right' && 'text-right')}
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
              onClick={() => (selection ? selection.onToggle(record.id) : onSelect(record.id))}
              className={cn(
                'h-8 cursor-pointer border-b border-line hover:bg-surface-alt',
                (selectedId === record.id || selection?.selectedIds.has(record.id)) && 'bg-surface-sunk',
              )}
            >
              {selection ? (
                <td className="w-8 px-2.5 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selection.selectedIds.has(record.id)}
                    onCheckedChange={() => selection.onToggle(record.id)}
                    aria-label={`Select ${String(getPath(record, collection.titleField) ?? record.id)}`}
                  />
                </td>
              ) : null}
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={columnStyle(column)}
                  className={cn(
                    TD,
                    column.align === 'right' && 'text-right',
                    column.key === collection.titleField && 'font-medium',
                  )}
                >
                  {renderCell(record, column, site)}
                </td>
              ))}
            </tr>
          ))}
          {records.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selection ? 1 : 0)} className="px-2.5 py-6 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </ScrollArea>
  )
}

/**
 * Registry widths were written as CSS grid tracks (`minmax(220px, 1.6fr)`) —
 * left over from a grid-based table — which a `<table>` silently ignores, so
 * those columns were sizing themselves. Translate the intent instead: the
 * minmax floor becomes a real minimum and auto table layout shares out the
 * rest, while plain values (`140px`) stay fixed.
 */
function columnStyle(column: ListColumn): { width?: string; minWidth?: string } {
  if (!column.width) return {}
  const minmax = /^minmax\(\s*([^,]+?)\s*,\s*[^)]+\)$/.exec(column.width)
  if (minmax) return { minWidth: minmax[1] }
  return { width: column.width, minWidth: column.width }
}

function renderCell(record: AdminRecord, column: ListColumn, site: SiteStatus): ReactNode {
  const value = getPath(record, column.key)
  const text = (content: string) => <span className="block truncate">{content}</span>

  switch (column.valueType) {
    case 'currency':
      return text(formatCurrency(Number(value ?? 0)))
    case 'date':
      return text(String(value ?? '').slice(0, 10))
    /* Membership size, e.g. how many resources a bundle contains. */
    case 'count':
      return text(String(Array.isArray(value) ? value.length : (value ?? 0)))

    /* The stored status, plus "Publishing" while the pages catch up with a
       publish. A Draft/Queued record that also has a live copy says so — the
       site is still showing an older version of it. */
    case 'publish': {
      const state = publishState(record, site)
      return (
        <Pill tone={PUBLISH_STATE_TONE[state]} title={publishStateHint(record, site)}>
          {PUBLISH_STATE_LABEL[state]}
        </Pill>
      )
    }

    /* When the version on the website went live. Only a record with a live
       copy has one — a Draft of a live record still shows the live date. */
    case 'publishedAt': {
      if (!isLive(record)) return <span className="text-muted">Not on site</span>
      return text(formatStamp(typeof value === 'string' ? value : undefined))
    }

    /* A toggle field. Its own column, never folded into another cell: Featured
       is not a status, and a cell should answer one question. */
    case 'boolean':
      return value ? text('Yes') : <span className="text-muted">No</span>

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

/** `2026-08-09 14:32` — dense enough for a table cell, precise enough to trust. */
function formatStamp(iso: string | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
