import { loadCustomerAccount, type CustomerAccountData } from './customer-account'
import { supabase } from './supabase'

/* Supabase-bound account reads. Pages call these instead of importing the
   client, so the data layer stays in lib/. */

/** The signed-in customer's own orders and payments. */
export function loadSignedInAccount(customerId: string): Promise<CustomerAccountData> {
  return supabase ? loadCustomerAccount(supabase, customerId) : Promise.reject(new Error('Account access is not configured.'))
}

/** The status of one of the customer's orders (row-level security scopes it), or null when unknown. */
export async function fetchOrderStatus(orderId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle()
  if (error) throw new Error(error.message)
  const status: unknown = data?.status
  return typeof status === 'string' ? status : null
}
