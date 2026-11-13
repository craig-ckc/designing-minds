import { createContext } from 'react'
import type { CmsSnapshot } from '@designing-minds/cms'

export const COVER_IMAGE_WIDTH = 720
export const COVER_IMAGE_HEIGHT = Math.round(COVER_IMAGE_WIDTH * 842 / 595)
export const COVER_THUMBNAIL_WIDTH = 320

export interface CoverImage {
  thumbnail: string
  full: string
}

export type CoverAssets = Record<string, CoverImage>
export type WebCatalogSnapshot = CmsSnapshot & { coverAssets?: CoverAssets }

export const CoverAssetsContext = createContext<CoverAssets | null>(null)

export function coverAssetKey(id: string | undefined, stacked: boolean): string {
  const kind = stacked ? 'bundle' : 'resource'
  return id === undefined ? kind : `${kind}:${id}`
}
