import { Link, useSearchParams } from 'react-router-dom'
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
    clearCart()
  }, [])

  return (
    <section className="section">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">Checkout</p>
          <h1 className="mt-2 text-[2rem]">Payment received</h1>
          <p className="mt-3 text-muted">PayFast is confirming the payment. Downloads appear on the Order Detail once the ITN has marked the order paid.</p>
          <div className="mt-6 flex justify-center gap-3">
            {orderId ? (
              <Button to={`/account/orders/${orderId}`} variant="solid">
                View order
              </Button>
            ) : null}
            <Link to="/account/orders" className="self-center text-ink underline underline-offset-4">
              Order history
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
