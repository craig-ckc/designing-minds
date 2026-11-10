import { Outlet } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { StatePanel } from '../components/ui/state-panel'
import { useCatalog } from './catalog'

/**
 * Layout route for pages that cannot render without the catalogue. Renders the
 * matched child route once it is ready, otherwise a loading or error panel
 * (with a retry) in its place. Routes beneath it read `useCatalogSnapshot()`.
 */
export function CatalogGate() {
  const { state, actions } = useCatalog()
  if (state.status === 'ready' && state.snapshot) return <Outlet />
  if (state.status === 'error') {
    return (
      <StatePanel title="Website unavailable" body={state.error ?? undefined}>
        <div>
          <Button variant="outline" onClick={actions.retry}>Try again</Button>
        </div>
      </StatePanel>
    )
  }
  return <StatePanel title="Preparing the catalogue…" />
}
