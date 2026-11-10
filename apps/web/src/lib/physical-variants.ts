import type { PhysicalCatalogProduct, PhysicalCatalogVariant } from '@designing-minds/cms'

/** Field keys may legitimately match Object prototype property names. */
export const readPhysicalValue = (values: Record<string, string> | undefined, key: string): string | undefined =>
  values && Object.hasOwn(values, key) && typeof values[key] === 'string' ? values[key] : undefined

/** Preserve compatible choices where possible, then move to a valid complete option. */
export function selectPhysicalVariant(variants: PhysicalCatalogVariant[], current: PhysicalCatalogVariant, key: string, value: string): PhysicalCatalogVariant | undefined {
  const matching = variants.filter((entry) => readPhysicalValue(entry.optionValues, key) === value)
  return matching.find((entry) => entry.available && Object.keys(current.optionValues).every((otherKey) => otherKey === key || readPhysicalValue(entry.optionValues, otherKey) === readPhysicalValue(current.optionValues, otherKey)))
    ?? matching.find((entry) => entry.available)
    ?? matching[0]
}

/** Shared validation describes storage keys; shoppers see their question labels. */
export function physicalSelectionMessage(product: PhysicalCatalogProduct, error: string | null): string | null {
  if (!error) return null
  for (const rule of product.customizationRules) {
    const prefix = `Customization value "${rule.key}" `
    if (!error.startsWith(prefix)) continue
    const label = rule.label
    const reason = error.slice(prefix.length)
    if (reason === 'is required.') return `${label} is required.`
    if (reason === 'must be a string.') return `Enter ${label}.`
    if (reason === 'must match an available option.') return `Choose an available option for ${label}.`
    if (rule.type === 'text') {
      if (reason === 'is shorter than minLength.') return `Enter at least ${rule.constraints?.minLength} characters for ${label}.`
      if (reason === 'is longer than maxLength.') return `Use no more than ${rule.constraints?.maxLength} characters for ${label}.`
      if (reason === 'cannot contain spaces.') return `${label} cannot contain spaces.`
      if (reason === 'contains a character that is not allowed.') return `Use the allowed characters for ${label}.`
    }
    return `Check ${label} and try again.`
  }
  if (error.startsWith('Customization ') || error.startsWith('Fixed pricing ') || error.startsWith('Name pricing ') || error === 'Choose a supported pricing method.') {
    return 'Personalisation is not available for this product right now. Please try again later.'
  }
  return error
}
