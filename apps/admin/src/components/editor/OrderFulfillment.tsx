import { useEffect, useRef, useState } from 'react'
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
  // Both stock-review decisions are confirmed before anything is written.
  const [confirming, setConfirming] = useState<'fulfil' | 'refunded' | null>(null)
  const mixed = record.hasDigital === true
  const confirmRef = useRef<HTMLButtonElement>(null)
  const fulfilTrigger = useRef<HTMLButtonElement>(null)
  const refundTrigger = useRef<HTMLButtonElement>(null)
  const lastTrigger = useRef<'fulfil' | 'refunded' | null>(null)
  // Focus follows the decision: into the confirm step, back to the button that
  // opened it on cancel, and back onto the confirm button after a failure.
  useEffect(() => {
    if (confirming) { confirmRef.current?.focus(); return }
    if (lastTrigger.current) (lastTrigger.current === 'fulfil' ? fulfilTrigger : refundTrigger).current?.focus()
  }, [confirming])
  useEffect(() => { if (error && confirming && !busy) confirmRef.current?.focus() }, [error, confirming, busy])
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

  /** Resolve an order held for a stock review: take stock now, or record a refund made in PayFast. */
  const resolveReview = async (decision: 'fulfil' | 'refunded' | 'cancel_physical') => {
    if (busy) return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const { error: rpcError } = await supabase.rpc('resolve_payment_review', { p_order_id: record.id, p_decision: decision })
      if (rpcError) throw new Error(rpcError.message)
      setConfirming(null)
      setSaved(true)
      onRefresh?.()
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : ''
      // Database messages are written for people; network failures are not.
      setError(/fetch|network|load failed/i.test(message) || !message ? 'Couldn’t reach the server. Check your connection and try again.' : message)
    } finally { setBusy(false) }
  }

  if (!record.hasPhysical) return null
  return <EditorSection title="Physical delivery" divided>
    <dl className={cn(SUNK, 'grid gap-2 p-3 text-ui')}>
      <div><dt className="text-muted">Fulfilment</dt><dd className={status === 'review' ? undefined : 'capitalize'}>{status === 'review' ? 'Needs a stock review' : status.replaceAll('_', ' ')}</dd></div>
      <div><dt className="text-muted">Delivery method</dt><dd>{String(record.shippingMethod ?? '—')} · {String(record.shippingLabel ?? '—')}</dd></div>
      {Object.entries(delivery).filter(([, value]) => value != null && value !== '').map(([key, value]) => <div key={key}><dt className="text-muted">{deliveryLabels[key] ?? key}</dt><dd>{String(value)}</dd></div>)}
    </dl>
    {!paid ? <p className={FIELD_HELP}>{record.status === 'payment_review'
      ? `Payment was received, but stock ran out before it arrived. Do not dispatch until this is resolved: restock and fulfil, or refund the payment in PayFast and record it here.${mixed ? ' The customer can already download the digital items in this order.' : ''}`
      : record.status === 'refunded' ? 'This order was refunded. Nothing will be dispatched.'
      : 'Dispatch is available after payment succeeds.'}</p> : null}
    {paid && status === 'cancelled' ? <p className={FIELD_HELP}>The physical items were refunded and won’t be dispatched. Digital items stay available to the customer.</p> : null}
    {record.status === 'payment_review' ? (confirming ? <div role="group" aria-label="Confirm stock review decision" aria-describedby={`${record.id}-review-question`} className="grid gap-2 rounded-control border border-line p-3">
      <p id={`${record.id}-review-question`} className="text-ui">{confirming === 'fulfil'
        ? 'Take the stock now so this order can be dispatched?'
        : mixed
          ? 'Only continue once you have refunded in the PayFast dashboard. What did you refund?'
          : 'Only continue once the payment has been refunded in the PayFast dashboard. The order will be marked refunded and won’t be dispatched.'}</p>
      <div className="flex flex-wrap gap-2">
        {confirming === 'refunded' && mixed ? <>
          <Button ref={confirmRef} variant="solid" disabled={busy} onClick={() => { setError(null); void resolveReview('cancel_physical') }}>{busy ? 'Saving…' : 'The physical items only'}</Button>
          <Button variant="outline" disabled={busy} onClick={() => { setError(null); void resolveReview('refunded') }}>The whole order (digital items lock too)</Button>
        </> : <Button ref={confirmRef} variant="solid" disabled={busy} onClick={() => { setError(null); void resolveReview(confirming) }}>{busy ? 'Saving…' : confirming === 'fulfil' ? 'Yes, fulfil the order' : 'Yes, the refund is done'}</Button>}
        <Button variant="ghost" disabled={busy} onClick={() => { setConfirming(null); setError(null) }}>Cancel</Button>
      </div>
    </div> : <div className="flex flex-wrap items-center gap-2">
      <Button ref={fulfilTrigger} variant="solid" disabled={busy} onClick={() => { setError(null); lastTrigger.current = 'fulfil'; setConfirming('fulfil') }}>Stock is available — fulfil</Button>
      <Button ref={refundTrigger} variant="outline" disabled={busy} onClick={() => { setError(null); lastTrigger.current = 'refunded'; setConfirming('refunded') }}>Record refund</Button>
    </div>) : null}
    {paid && nextStatus ? <div className="grid gap-3">
      <label className="grid gap-1"><span className={FIELD_LABEL}>Tracking number (optional)</span><Input value={trackingNumber} disabled={busy} maxLength={100} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
      <label className="grid gap-1"><span className={FIELD_LABEL}>Tracking URL (optional)</span><Input type="url" value={trackingUrl} disabled={busy} maxLength={2000} placeholder="https://…" onChange={(event) => setTrackingUrl(event.target.value)} /></label>
      <div><Button variant="solid" disabled={busy} onClick={() => void submit()}>{busy ? 'Saving…' : nextStatus === 'shipped' ? 'Mark as shipped' : 'Mark as delivered'}</Button></div>
    </div> : null}
    {saved ? <p role="status" className="text-ui text-success">Fulfilment updated.</p> : null}
    {error ? <p role="alert" className="text-ui text-danger">{error}</p> : null}
  </EditorSection>
}
