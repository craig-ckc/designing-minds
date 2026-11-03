import { CATALOG_SORT_OPTIONS, readCatalogSort, type CatalogSort } from '../../lib/catalog-sort'
import { SelectControl } from './select'

export function CatalogSortControl({ value, onChange }: { value: CatalogSort; onChange: (sort: CatalogSort) => void }) {
  return (
    <SelectControl
      label="Sort resources"
      value={value}
      options={CATALOG_SORT_OPTIONS}
      onChange={(next) => onChange(readCatalogSort(next))}
      compact
      align="end"
      className="w-auto min-w-36 shrink-0"
    />
  )
}
