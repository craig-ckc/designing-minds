import type { PhysicalCatalogProduct } from '@designing-minds/cms'

/** Historical receipts keep their keys; give unknown keys a readable fallback. */
export function commerceFieldLabel(key: string, product?: Pick<PhysicalCatalogProduct, 'customizationRules'>): string {
  const configured = product?.customizationRules.find((rule) => rule.key === key)?.label
  if (configured?.trim()) return configured
  if (key.toLowerCase() === 'color' || key.toLowerCase() === 'colour') return 'Colour'
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1).toLowerCase() : 'Personalisation'
}
