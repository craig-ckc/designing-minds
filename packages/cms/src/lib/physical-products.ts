import type { Grade, Product, ResourceFormat, Term } from '../types'
import type { PhysicalPricingMode, PhysicalVariantDraft } from './commerce'

export interface TextCustomizationRule {
  key: string
  label: string
  type: 'text'
  required: boolean
  constraints?: TextCustomizationConstraints
}

export interface TextCustomizationConstraints {
  minLength?: number
  maxLength?: number
  /** Literal set of Unicode code points accepted by this field. */
  allowedCharacters?: string
  /**
   * Only `true` accepts U+0020, even if it is absent from allowedCharacters.
   * When false or omitted, U+0020 is rejected. Other whitespace follows the
   * allowedCharacters set when present and is unrestricted when absent.
   */
  allowSpaces?: boolean
}

export interface SelectCustomizationRule {
  key: string
  label: string
  type: 'select'
  required: boolean
  options: string[]
}

export type CustomizationRule = TextCustomizationRule | SelectCustomizationRule

export interface PhysicalProduct extends Omit<Product, 'grade' | 'term' | 'year' | 'resourceFormat' | 'productType'> {
  productType: 'physical'
  grade: Grade | null
  term: Term | null
  year: string | null
  resourceFormat: ResourceFormat | null
  weightGrams: number | null
  lengthMm: number | null
  widthMm: number | null
  heightMm: number | null
  customizationRules: CustomizationRule[]
  /** Physical products cannot grant digital file entitlements. */
  purchasedFiles: []
  pricingMode: PhysicalPricingMode
  pricingFieldKey: string | null
  billableCharacters: string | null
  variants?: PhysicalVariantDraft[]
}

const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[]): boolean =>
  Object.keys(value).every((key) => allowed.includes(key))

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

const isNonemptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isNonnegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2_147_483_647

/**
 * Validates the persisted customization-rule JSON shape. An empty array is
 * valid configuration data, but means that customization is not configured.
 * The function checks strings without normalizing or rewriting their values.
 */
export function customizationRulesValidation(value: unknown): string | null {
  if (!Array.isArray(value)) return 'Customization rules must be an array.'

  const keys = new Set<string>()
  for (const [index, item] of value.entries()) {
    const path = `Customization rule ${index + 1}`
    if (!isRecord(item)) return `${path} must be an object.`
    if (!isNonemptyString(item.key)) return `${path} key must be a non-empty string.`
    if (!isNonemptyString(item.label)) return `${path} label must be a non-empty string.`
    if (keys.has(item.key)) return `Customization rule key "${item.key}" is duplicated.`
    keys.add(item.key)
    if (typeof item.required !== 'boolean') return `${path} required must be a boolean.`

    if (item.type === 'text') {
      if (!hasOnlyKeys(item, ['key', 'label', 'type', 'required', 'constraints'])) {
        return `${path} has fields that are not valid for a text rule.`
      }
      if ('constraints' in item) {
        if (!isRecord(item.constraints)) return `${path} constraints must be an object.`
        const constraints = item.constraints
        if (!hasOnlyKeys(constraints, ['minLength', 'maxLength', 'allowedCharacters', 'allowSpaces'])) {
          return `${path} constraints have unknown fields.`
        }
        if ('minLength' in constraints && !isNonnegativeInteger(constraints.minLength)) return `${path} minLength must be a non-negative integer.`
        if ('maxLength' in constraints && !isNonnegativeInteger(constraints.maxLength)) return `${path} maxLength must be a non-negative integer.`
        if (typeof constraints.minLength === 'number' && typeof constraints.maxLength === 'number' && constraints.minLength > constraints.maxLength) {
          return `${path} minLength cannot exceed maxLength.`
        }
        if ('allowedCharacters' in constraints && typeof constraints.allowedCharacters !== 'string') {
          return `${path} allowedCharacters must be a string.`
        }
        if ('allowSpaces' in constraints && typeof constraints.allowSpaces !== 'boolean') return `${path} allowSpaces must be a boolean.`
      }
      continue
    }

    if (item.type === 'select') {
      if (!hasOnlyKeys(item, ['key', 'label', 'type', 'required', 'options'])) {
        return `${path} has fields that are not valid for a select rule.`
      }
      if (!Array.isArray(item.options) || item.options.length === 0) return `${path} options must be a non-empty array.`
      const options = new Set<string>()
      for (const option of item.options) {
        if (!isNonemptyString(option)) return `${path} options must be non-empty strings.`
        if (options.has(option)) return `${path} options must be unique.`
        options.add(option)
      }
      continue
    }

    return `${path} type must be "text" or "select".`
  }

  return null
}

/**
 * Checks submitted customization values against configured rules. Lengths are
 * counted as Unicode code points; submitted strings are never trimmed or
 * normalized. An empty rule array is well-formed but cannot accept values.
 */
export function validateCustomizationValues(rules: unknown, values: unknown): string | null {
  const configurationError = customizationRulesValidation(rules)
  if (configurationError) return configurationError
  if (!Array.isArray(rules) || rules.length === 0) return 'Customization is not configured.'
  if (!isRecord(values)) return 'Customization values must be an object.'

  const expectedKeys = new Set((rules as CustomizationRule[]).map((rule) => rule.key))
  for (const key of Object.keys(values)) {
    if (!expectedKeys.has(key)) return `Unexpected customization value "${key}".`
  }

  for (const rule of rules as CustomizationRule[]) {
    const hasValue = Object.hasOwn(values, rule.key)
    if (!hasValue) {
      if (rule.required) return `Customization value "${rule.key}" is required.`
      continue
    }

    const value = values[rule.key]
    if (typeof value !== 'string') return `Customization value "${rule.key}" must be a string.`
    if (rule.required && value.length === 0) return `Customization value "${rule.key}" is required.`

    if (rule.type === 'select') {
      if (!rule.options.includes(value)) return `Customization value "${rule.key}" must match an available option.`
      continue
    }

    const constraints = rule.constraints
    const codePoints = Array.from(value)
    if (constraints?.minLength !== undefined && codePoints.length < constraints.minLength) {
      return `Customization value "${rule.key}" is shorter than minLength.`
    }
    if (constraints?.maxLength !== undefined && codePoints.length > constraints.maxLength) {
      return `Customization value "${rule.key}" is longer than maxLength.`
    }

    const allowed = constraints?.allowedCharacters === undefined ? null : new Set(Array.from(constraints.allowedCharacters))
    for (const character of codePoints) {
      if (character === ' ' && constraints?.allowSpaces !== true) return `Customization value "${rule.key}" cannot contain spaces.`
      if (allowed && !allowed.has(character) && !(character === ' ' && constraints?.allowSpaces === true)) {
        return `Customization value "${rule.key}" contains a character that is not allowed.`
      }
    }
  }

  return null
}
