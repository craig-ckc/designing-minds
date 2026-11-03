import { useCallback, useEffect, useRef, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import type { CmsSnapshot } from '@designing-minds/cms'
import { Button } from '../../components/ui/button'
import { StatePanel } from '../../components/ui/state-panel'
import { useAuth } from '../../lib/auth'
import { loadCustomerAccount, type CustomerAccountData } from '../../lib/customer-account'
import { supabase } from '../../lib/supabase'
import { NotFoundPage } from '../not-found-page'
import { AccountPage } from './account-page'
import { SignedOut } from './account-shell'
import { OrderDetailPage } from './order-detail-page'
import { OrderHistoryPage } from './order-history-page'

interface AccountResult {
  customerId: string
  data?: CustomerAccountData
  error?: string
}

/** Mounted only under /account, never while a customer browses public pages. */
export function AccountRoutes({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer, loading } = useAuth()
  const customerId = customer?.id
  const [result, setResult] = useState<AccountResult | null>(null)
  const requestVersion = useRef(0)

  const refresh = useCallback(() => {
    const version = ++requestVersion.current
    if (!customerId) return Promise.resolve()
    const request = supabase
      ? loadCustomerAccount(supabase, customerId)
      : Promise.reject(new Error('Account access is not configured.'))
    return request.then((data) => {
      if (version === requestVersion.current) setResult({ customerId, data })
    }).catch((error: unknown) => {
      if (version === requestVersion.current) {
        setResult({ customerId, error: error instanceof Error ? error.message : 'Unable to load your account.' })
      }
    })
  }, [customerId])

  useEffect(() => {
    void refresh()
    return () => { requestVersion.current += 1 }
  }, [refresh])

  if (loading) return <StatePanel title="Loading your account…" />
  if (!customer) return <SignedOut />
  // Never render data from a previous session while a new account is loading.
  if (result?.customerId !== customer.id) return <StatePanel title="Loading your account…" />
  if (result.error) {
    return (
      <StatePanel title="Unable to load your account" body={result.error}>
        <Button type="button" variant="outline" onClick={() => void refresh()}>Try again</Button>
      </StatePanel>
    )
  }
  if (!result.data) return <StatePanel title="Loading your account…" />

  const accountSnapshot = { ...snapshot, ...result.data, customers: [customer] }
  return (
    <Routes>
      <Route index element={<AccountPage snapshot={accountSnapshot} />} />
      <Route path="orders" element={<OrderHistoryPage snapshot={accountSnapshot} />} />
      <Route path="orders/:orderId" element={<OrderDetailPage snapshot={accountSnapshot} onRefresh={refresh} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
