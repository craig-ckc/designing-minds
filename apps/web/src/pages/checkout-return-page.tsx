import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Container } from '../components/ui/container'
import { Button } from '../components/ui/button'
import { clearCart } from '../lib/cart'
import { useNoindex } from '../lib/use-noindex'

export function CheckoutReturnPage() {
  useNoindex()
  const [params] = useSearchParams()
  const orderId = params.get('order')

  useEffect(() => {
    // Checkout submits the whole cart, so the whole cart is done with. The
    // account copy also loses these lines in the database once the ITN lands.
    clearCart()
  }, [])

  return (
    <section className="section">
      <Container>
        <div className="mx-auto max-w-narrow text-center">
          <h1 className="mt-3 text-h1">Payment received</h1>
          <p className="mt-4 lead">We’re confirming your payment with PayFast. Your downloads appear on your order page as soon as it is confirmed.</p>
          <div className="mt-8 flex justify-center">
            <Button to={orderId ? `/account/orders/${orderId}` : '/account/orders'} variant="solid">
              {orderId ? 'View order' : 'Order history'}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
