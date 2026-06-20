import type { CmsSnapshot } from '@designing-minds/cms'

export function getFeatured(snapshot: CmsSnapshot, limit: number) {
  return [...snapshot.products]
    .sort((left, right) => new Date(right.modified).getTime() - new Date(left.modified).getTime())
    .slice(0, limit)
}
