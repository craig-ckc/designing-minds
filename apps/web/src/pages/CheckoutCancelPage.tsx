import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { useNoindex } from '../lib/useNoindex'

export function CheckoutCancelPage() {
  useNoindex()
  return (
    <section className="section">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">Checkout</p>
          <h1 className="mt-2 text-[2rem]">Checkout cancelled</h1>
          <p className="mt-3 text-muted">Your cart is still saved. You can return to checkout when you are ready.</p>
          <div className="mt-6 flex justify-center">
            <Button to="/cart" variant="solid">
              Back to cart
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

