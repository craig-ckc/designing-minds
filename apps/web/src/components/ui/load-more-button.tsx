import { Button } from './button'

export function LoadMoreButton({ remaining, itemLabel, onLoadMore }: { remaining: number; itemLabel: string; onLoadMore: () => void }) {
  if (remaining <= 0) return null

  return (
    <div className="mt-10 flex justify-center">
      <Button variant="solid" type="button" onClick={onLoadMore}>
        Load more {itemLabel} <span>({remaining} remaining)</span>
      </Button>
    </div>
  )
}
