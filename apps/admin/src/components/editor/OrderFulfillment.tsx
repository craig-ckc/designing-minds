import { useState } from 'react'
import type { AdminRecord } from '../../cms/types'
import { nextFulfillmentStatus } from '../../cms/physical-product-edit'
import { cn, FIELD_HELP, FIELD_LABEL, SUNK } from '../../design'
import { apiUrl } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../primitives'
import { EditorSection } from './EditorSection'

const deliveryLabels: Record<string, string> = { recipientName: 'Recipient', phone: 'Contact number', addressLine1: 'Street address', addressLine2: 'Address line 2', suburb: 'Suburb', city: 'City', province: 'Province', postalCode: 'Postal code', country: 'Country' }

export function OrderFulfillment({ record, onRefresh }: { record: AdminRecord; onRefresh?: () => void }) {
  const [status, setStatus] = useState(String(record.fulfillmentStatus ?? 'unfulfilled'))
  const [trackingNumber, setTrackingNumber] = useState(String(record.trackingNumber ?? ''))
  const [trackingUrl, setTrackingUrl] = useState(String(record.trackingUrl ?? ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [followedStatus, setFollowedStatus] = useState(record.fulfillmentStatus)
  if (record.fulfillmentStatus !== followedStatus) {
    setFollowedStatus(record.fulfillmentStatus)
    setStatus(String(record.fulfillmentStatus ?? 'unfulfilled'))
    setTrackingNumber(String(record.trackingNumber ?? ''))
    setTrackingUrl(String(record.trackingUrl ?? ''))
  }
  const nextStatus = nextFulfillmentStatus(status)
  const paid = record.status === 'paid' || record.status === 'fulfilled'
  const delivery = record.delivery && typeof record.delivery === 'object' ? record.delivery as Record<string, unknown> : {}

  const submit = async () => {
    if (!paid || !nextStatus || busy) return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Your session has expired. Sign in again before updating fulfilment.')
      const response = await fetch(apiUrl('/api/admin/order-fulfillment'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: record.id, status: nextStatus, trackingNumber: trackingNumber || null, trackingUrl: trackingUrl || null }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Unable to update fulfilment.')
      setStatus(nextStatus)
      setSaved(true)
      onRefresh?.()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to update fulfilment.')
    } finally { setBusy(false) }
  }

  if (!record.hasPhysical) return null
  return <EditorSection title="Physical delivery" divided>
    <dl className={cn(SUNK, 'grid gap-2 p-3 text-ui')}>
      <div><dt className="text-muted">Fulfilment</dt><dd className="capitalize">{status.replaceAll('_', ' ')}</dd></div>
      <div><dt className="text-muted">Delivery method</dt><dd>{String(record.shippingMethod ?? '—')} · {String(record.shippingLabel ?? '—')}</dd></div>
      {Object.entries(delivery).filter(([, value]) => value != null && value !== '').map(([key, value]) => <div key={key}><dt className="text-muted">{deliveryLabels[key] ?? key}</dt><dd>{String(value)}</dd></div>)}
    </dl>
    {!paid ? <p className={FIELD_HELP}>{record.status === 'payment_review' ? 'Payment was received, but stock needs review. Do not dispatch this order until it has been resolved.' : 'Dispatch is available after payment succeeds.'}</p> : null}
    {paid && nextStatus ? <div className="grid gap-3">
      <label className="grid gap-1"><span className={FIELD_LABEL}>Tracking number (optional)</span><Input value={trackingNumber} disabled={busy} maxLength={100} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
      <label className="grid gap-1"><span className={FIELD_LABEL}>Tracking URL (optional)</span><Input type="url" value={trackingUrl} disabled={busy} maxLength={2000} placeholder="https://…" onChange={(event) => setTrackingUrl(event.target.value)} /></label>
      <div><Button variant="solid" disabled={busy} onClick={() => void submit()}>{busy ? 'Saving…' : nextStatus === 'shipped' ? 'Mark as shipped' : 'Mark as delivered'}</Button></div>
    </div> : null}
    {saved ? <p role="status" className="text-ui text-success">Fulfilment updated.</p> : null}
    {error ? <p role="alert" className="text-ui text-danger">{error}</p> : null}
  </EditorSection>
}
