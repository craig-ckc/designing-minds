import { useEffect, useState } from 'react'
import type { DiagnosticEvent } from '../../../../packages/utils/src/diagnostics.ts'
import { supabase } from '../lib/supabase'
import { diagnosticColumns, validateDiagnosticFilters, type DiagnosticFilters } from '../lib/diagnostic-query'

const initial: DiagnosticFilters = { level: 'error', referenceType: 'requestId', reference: '', days: 1 }
const inputClass = 'rounded-control border border-line bg-surface px-3 py-2 text-ui'
type Row = DiagnosticEvent & { receivedAt: string }

export function DiagnosticsPage() {
  const [draft, setDraft] = useState(initial)
  const [query, setQuery] = useState({ filters: initial, page: 0, until: new Date().toISOString() })
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const validation = validateDiagnosticFilters(query.filters)
        if (validation) throw new Error(validation)
        if (!supabase) throw new Error('Supabase is not configured.')
        let request = supabase.from('diagnostic_events').select(diagnosticColumns)
          .gte('receivedAt', new Date(Date.parse(query.until) - query.filters.days * 86_400_000).toISOString())
          .lte('receivedAt', query.until)
          .order('occurredAt', { ascending: false }).order('sequence', { ascending: false }).order('id', { ascending: false })
          .range(query.page * 100, query.page * 100 + 99)
        if (query.filters.level) request = request.eq('level', query.filters.level)
        if (query.filters.reference.trim()) request = request.eq(query.filters.referenceType, query.filters.reference.trim())
        const { data, error: queryError } = await request.abortSignal(controller.signal)
        if (queryError) throw new Error('Logs could not be loaded. Check the diagnostics migration, your admin access, and database availability.')
        if (!cancelled) setRows((data ?? []) as Row[])
      } catch (e) {
        if (!cancelled) { setRows([]); setError(e instanceof Error ? e.message : 'Logs could not be loaded.') }
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true; controller.abort() }
  }, [query])
  const trace = (referenceType: DiagnosticFilters['referenceType'], reference: string) => {
    const filters: DiagnosticFilters = { ...query.filters, level: '', referenceType, reference }
    setDraft(filters)
    setQuery({ filters, page: 0, until: new Date().toISOString() })
  }
  return (
    <main className="min-h-0 flex-1 overflow-auto p-6">
      <h1 className="text-xl font-semibold">Diagnostics</h1>
      <p className="my-3 text-ui text-muted">Search a customer’s reference, then follow the request, session, or order. Browser events are client-reported; server events show API processing. Retention: 30 days, cleaned daily.</p>
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(event) => {
        event.preventDefault()
        const validation = validateDiagnosticFilters(draft)
        if (validation) { setError(validation); return }
        setQuery({ filters: { ...draft }, page: 0, until: new Date().toISOString() })
      }}>
        <label className="grid gap-1 text-ui">Level
          <select className={inputClass} value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as DiagnosticFilters['level'] })}>
            <option value="">All events</option><option value="error">Errors</option><option value="warning">Warnings</option><option value="info">Info</option>
          </select>
        </label>
        <label className="grid gap-1 text-ui">Period
          <select className={inputClass} value={draft.days} onChange={(e) => setDraft({ ...draft, days: Number(e.target.value) as 1 | 7 | 30 })}>
            <option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
          </select>
        </label>
        <label className="grid gap-1 text-ui">Reference type
          <select className={inputClass} value={draft.referenceType} onChange={(e) => setDraft({ ...draft, referenceType: e.target.value as DiagnosticFilters['referenceType'] })}>
            <option value="requestId">Request</option><option value="sessionId">Session</option><option value="orderId">Order</option>
          </select>
        </label>
        <label className="grid gap-1 text-ui">Reference ID
          <input className={`${inputClass} w-80`} value={draft.reference} placeholder="Optional full reference ID" onChange={(e) => setDraft({ ...draft, reference: e.target.value })} />
        </label>
        <button className={inputClass} type="submit" disabled={loading}>Search / refresh</button>
      </form>
      {error ? <p role="alert" className="mb-4 text-ui">{error}</p> : null}
      <p role="status" className="mb-3 text-ui text-muted">{loading ? 'Loading logs…' : rows.length ? `Page ${query.page + 1} · ${rows.length} events · newest first` : 'No matching events. Collection begins after diagnostics is enabled on functions.'}</p>
      {!loading && rows.length > 0 ? (
        <table className="w-full border-collapse text-left text-ui">
          <thead><tr>{['Time', 'Event', 'Outcome', 'Trace'].map((title) => <th key={title} className="border-b border-line p-3">{title}</th>)}</tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="border-b border-line p-3 whitespace-nowrap"><time dateTime={row.occurredAt}>{new Date(row.occurredAt).toLocaleString()}</time><div className="text-muted">{row.source} · {row.level}</div></td>
              <td className="border-b border-line p-3"><strong>{row.event}</strong><div className="text-muted">{row.route}</div>{row.asset ? <code>{row.asset}</code> : null}{row.release ? <div>Release {row.release.slice(0, 7)}</div> : null}</td>
              <td className="border-b border-line p-3">{[row.status ? `HTTP ${row.status}` : '', row.errorKind, row.code, row.durationMs !== null ? `${row.durationMs} ms` : ''].filter(Boolean).join(' · ') || '—'}</td>
              <td className="border-b border-line p-3">{(['requestId', 'sessionId', 'orderId'] as const).map((key) => row[key] ? (
                <button type="button" key={key} className="mb-1 block break-all text-left underline underline-offset-2" onClick={() => trace(key, row[key]!)}>{key.replace('Id', '')}: {row[key]}</button>
              ) : null)}</td>
            </tr>
          ))}</tbody>
        </table>
      ) : null}
      <div className="mt-4 flex gap-3">
        <button type="button" className={inputClass} disabled={loading || query.page === 0} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Newer</button>
        <button type="button" className={inputClass} disabled={loading || rows.length < 100} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Older</button>
      </div>
    </main>
  )
}
