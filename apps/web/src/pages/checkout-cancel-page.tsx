import { Container } from '../components/ui/container'
import { Button } from '../components/ui/button'
import { useNoindex } from '../lib/use-noindex'

export function CheckoutCancelPage() {
  useNoindex()
  return (
    <section className="section">
      <Container>
        <div className="mx-auto max-w-narrow text-center">
          <h1 className="mt-3 text-h1">Checkout cancelled</h1>
          <p className="mt-4 lead">Your cart is still saved. You can return to checkout when you are ready.</p>
          <div className="mt-8 flex justify-center">
            <Button to="/cart" variant="solid">
              Back to cart
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

