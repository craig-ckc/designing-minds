import type { OrderStatus } from '@designing-minds/cms'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'

export function OrderRecoveryNotice({ status }: { status: OrderStatus }) {
  if (status !== 'failed') return null
  return (
    <Notice tone="info">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>Payment was not completed. Review your cart before trying again.</p>
        <Button to="/cart" variant="outline" size="sm">Review cart</Button>
      </div>
    </Notice>
  )
}
