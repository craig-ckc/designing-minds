import type { AdminField } from '../../cms/types'

/** Field types that read better spanning the full width of the editor grid. */
export const FULL_WIDTH_TYPES: ReadonlySet<AdminField['type']> = new Set([
  'textarea',
  'slug',
  'multiReference',
  'fileList',
  'readonly',
])
