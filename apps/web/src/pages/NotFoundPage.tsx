import { StatePanel } from '../components/ui/StatePanel'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <StatePanel eyebrow="404" title="Page not found" body="This route doesn’t match anything in the catalogue.">
      <div className="mt-2 flex justify-center">
        <Button to="/" variant="text">
          Back to home
        </Button>
      </div>
    </StatePanel>
  )
}
