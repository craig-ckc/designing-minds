import type { Grade, Product, ResourceFormat, Term } from '../types'
import type { PhysicalPricingMode, PhysicalVariantDraft } from './commerce'

/* -------------------------------------------------------------------------
   Physical product configuration — the TypeScript mirror of the SQL checks in
   supabase/patch/2026-11-12-physical-options.sql. The database is the trust
   boundary; these give the admin and storefront the same answers early.

   Two kinds of choice:
   - variant options (`variantOptions`) are STOCKED dimensions — Colour, Size.
     Each variant picks one declared value per option.
   - customisation rules are what the shopper tells us — a name, a style.
     They are never stocked and may add to the price.
   ------------------------------------------------------------------------- */

/** Only ask this question when the chosen variant has one of these values. */
export type RuleCondition = Record<string, string[]>

export interface TextCustomizationRule {
  key: string
  label: string
  type: 'text'
  required: boolean
  constraints?: TextCustomizationConstraints
  /** 'uppercase' stores and prices the answer in capitals (letter tiles). */
  transform?: 'uppercase'
  appliesWhen?: RuleCondition
  /** Instructions shown to shoppers under the question, e.g. an example. */
  help?: string
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

/** A choice with presentation and an optional price change per item. */
export interface CustomizationChoice {
  value: string
  label?: string
  /** `#rrggbb` swatch shown instead of a text button. */
  swatch?: string
  /** Added to the item price when chosen. Never negative. */
  priceDeltaZar?: number
}

/** Plain strings remain valid choices (the original format). */
export type CustomizationOption = string | CustomizationChoice

export interface SelectCustomizationRule {
  key: string
  label: string
  type: 'select'
  required: boolean
  options: CustomizationOption[]
  display?: 'buttons' | 'swatches' | 'dropdown'
  appliesWhen?: RuleCondition
  help?: string
}

export type CustomizationRule = TextCustomizationRule | SelectCustomizationRule

export interface VariantOptionValue {
  value: string
  swatch?: string
}

/** A stocked option the product declares, e.g. Colour: Pink, Blue. */
export interface VariantOptionDefinition {
  key: string
  label: string
  display?: 'buttons' | 'swatches'
  values: VariantOptionValue[]
}

export type InventoryPolicy = 'tracked' | 'made_to_order'
export type PreviewTemplate = 'letter-tiles'
export const PREVIEW_TEMPLATES: readonly PreviewTemplate[] = ['letter-tiles']

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
  variantOptions: VariantOptionDefinition[]
  /** Working days to make a made-to-order item, shown to shoppers. */
  leadTimeDays: number | null
  previewTemplate: PreviewTemplate | null
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

const SWATCH = /^#[0-9a-fA-F]{6}$/

/** The stored value of a choice, whichever format it uses. */
export const choiceValue = (option: CustomizationOption): string => typeof option === 'string' ? option : option.value

/** What the shopper reads for a choice. */
export const choiceLabel = (option: CustomizationOption): string =>
  typeof option === 'string' ? option : option.label?.trim() || option.value

export const choiceDetails = (option: CustomizationOption): CustomizationChoice =>
  typeof option === 'string' ? { value: option } : option

/** The configured choice behind a submitted value, if any. */
export function findChoice(rule: SelectCustomizationRule, value: string | undefined): CustomizationChoice | undefined {
  if (value === undefined) return undefined
  const option = rule.options.find((entry) => choiceValue(entry) === value)
  return option === undefined ? undefined : choiceDetails(option)
}

/** True when the question applies to a variant with these option values. */
export function ruleApplies(rule: Pick<CustomizationRule, 'appliesWhen'>, variantValues: Record<string, string> | undefined): boolean {
  if (!rule.appliesWhen) return true
  return Object.entries(rule.appliesWhen).every(([key, wanted]) => {
    const chosen = variantValues && Object.hasOwn(variantValues, key) ? variantValues[key] : undefined
    return chosen !== undefined && wanted.includes(chosen)
  })
}

export const applicableRules = <T extends CustomizationRule>(rules: T[], variantValues: Record<string, string> | undefined): T[] =>
  rules.filter((rule) => ruleApplies(rule, variantValues))

/**
 * Drop answers to questions that do not apply to the chosen variant and apply
 * text transforms. Unknown keys stay so validation can reject them — the same
 * steps the database takes before validating and pricing.
 */
export function normalizeCustomizations(rules: CustomizationRule[], values: Record<string, string>, variantValues: Record<string, string> | undefined): Record<string, string> {
  const result: Record<string, string> = { ...values }
  for (const rule of rules) {
    if (!ruleApplies(rule, variantValues)) { delete result[rule.key]; continue }
    if (rule.type === 'text' && rule.transform === 'uppercase' && typeof result[rule.key] === 'string') {
      result[rule.key] = result[rule.key].toUpperCase()
    }
  }
  return result
}

function conditionValidation(name: string, value: unknown): string | null {
  if (!isRecord(value) || Object.keys(value).length === 0) return `${name}: choose which option it depends on.`
  for (const [key, wanted] of Object.entries(value)) {
    if (!key.trim()) return `${name}: choose which option it depends on.`
    if (!Array.isArray(wanted) || wanted.length === 0 || !wanted.every(isNonemptyString)) return `${name}: pick at least one value it is asked for, or it is never asked.`
  }
  return null
}

function choiceValidation(path: string, option: unknown): string | null {
  if (typeof option === 'string') return isNonemptyString(option) ? null : `${path} options must be non-empty strings.`
  if (!isRecord(option)) return `${path} options must be non-empty strings or choice objects.`
  if (!hasOnlyKeys(option, ['value', 'label', 'swatch', 'priceDeltaZar'])) return `${path} has a choice with unknown fields.`
  if (!isNonemptyString(option.value)) return `${path} choices need a value.`
  if ('label' in option && !isNonemptyString(option.label)) return `${path} choice labels cannot be empty.`
  if ('swatch' in option && (typeof option.swatch !== 'string' || !SWATCH.test(option.swatch))) return `${path} swatches must be colours such as #f3a0c2.`
  if ('priceDeltaZar' in option) {
    const delta = option.priceDeltaZar
    if (typeof delta !== 'number' || !Number.isFinite(delta) || delta < 0 || delta > 100_000 || Math.abs(Math.round(delta * 100) - delta * 100) > 1e-6) {
      return `${path} price changes must be zero or more, with at most two decimal places.`
    }
  }
  return null
}

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
    if ('appliesWhen' in item) {
      const conditionError = conditionValidation(isNonemptyString(item.label) ? `“${item.label}”` : path, item.appliesWhen)
      if (conditionError) return conditionError
    }
    if ('help' in item && (typeof item.help !== 'string' || Array.from(item.help).length > 300)) return `${path} instructions must be text of at most 300 characters.`

    if (item.type === 'text') {
      if (!hasOnlyKeys(item, ['key', 'label', 'type', 'required', 'constraints', 'transform', 'appliesWhen', 'help'])) {
        return `${path} has fields that are not valid for a text rule.`
      }
      if ('transform' in item && item.transform !== 'uppercase') return `${path} transform must be "uppercase".`
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
      if (!hasOnlyKeys(item, ['key', 'label', 'type', 'required', 'options', 'display', 'appliesWhen', 'help'])) {
        return `${path} has fields that are not valid for a select rule.`
      }
      if ('display' in item && !['buttons', 'swatches', 'dropdown'].includes(String(item.display))) return `${path} display must be buttons, swatches or a dropdown.`
      if (!Array.isArray(item.options) || item.options.length === 0) return `${path} options must be a non-empty array.`
      const options = new Set<string>()
      for (const option of item.options) {
        const optionError = choiceValidation(path, option)
        if (optionError) return optionError
        const stored = choiceValue(option as CustomizationOption)
        if (options.has(stored)) return `${path} options must be unique.`
        options.add(stored)
      }
      continue
    }

    return `${path} type must be "text" or "select".`
  }

  return null
}

/** Declared stocked options: at most three, each with unique non-empty values. */
export function variantOptionsValidation(value: unknown): string | null {
  if (!Array.isArray(value)) return 'Product options must be a list.'
  if (value.length > 3) return 'Use at most three product options.'
  const keys = new Set<string>()
  for (const [index, option] of value.entries()) {
    const path = `Product option ${index + 1}`
    if (!isRecord(option) || !hasOnlyKeys(option, ['key', 'label', 'display', 'values'])) return `${path} has unknown fields.`
    if (!isNonemptyString(option.key) || !isNonemptyString(option.label)) return `${path} needs a name.`
    if (keys.has(option.key)) return `Product option "${option.label}" is listed twice.`
    keys.add(option.key)
    if ('display' in option && !['buttons', 'swatches'].includes(String(option.display))) return `${path} display must be buttons or swatches.`
    if (!Array.isArray(option.values) || option.values.length === 0) return `${path} needs at least one value.`
    if (option.values.length > 50) return `${path} has too many values.`
    const values = new Set<string>()
    for (const entry of option.values) {
      if (!isRecord(entry) || !hasOnlyKeys(entry, ['value', 'swatch']) || !isNonemptyString(entry.value)) return `${path} values need a name.`
      if (values.has(entry.value)) return `${path} lists "${entry.value}" twice.`
      values.add(entry.value)
      if ('swatch' in entry && (typeof entry.swatch !== 'string' || !SWATCH.test(entry.swatch))) return `${path} swatches must be colours such as #f3a0c2.`
    }
  }
  return null
}

/** Rules and options must not overlap, and conditions must use declared values. */
export function physicalConfigurationValidation(variantOptions: unknown, rules: unknown, pricingFieldKey: string | null): string | null {
  const optionsError = variantOptionsValidation(variantOptions)
  if (optionsError) return optionsError
  const rulesError = customizationRulesValidation(rules)
  if (rulesError) return rulesError
  const options = variantOptions as VariantOptionDefinition[]
  for (const rule of rules as CustomizationRule[]) {
    if (options.some((option) => option.key === rule.key)) return `"${rule.label}" uses the same key as a product option. Product options are chosen by picking a variant.`
    if (!rule.appliesWhen) continue
    if (rule.key === pricingFieldKey) return `"${rule.label}" sets the per-letter price, so it must always be asked.`
    for (const [key, wanted] of Object.entries(rule.appliesWhen)) {
      const option = options.find((entry) => entry.key === key)
      if (!option) return `"${rule.label}" depends on an option the product does not have.`
      const missing = wanted.find((value) => !option.values.some((entry) => entry.value === value))
      if (missing) return `"${rule.label}" depends on ${option.label} "${missing}", which is not offered.`
    }
  }
  return null
}

/** True when a variant picks exactly one declared value for every declared option. */
export function variantConforms(options: VariantOptionDefinition[], values: Record<string, string>): boolean {
  if (Object.keys(values).length !== options.length) return false
  return options.every((option) => Object.hasOwn(values, option.key) && option.values.some((entry) => entry.value === values[option.key]))
}

/** Every combination of declared values, in declaration order. */
export function variantCombinations(options: VariantOptionDefinition[]): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (combinations, option) => combinations.flatMap((combination) => option.values.map((entry) => ({ ...combination, [option.key]: entry.value }))),
    options.length ? [{}] : [],
  )
}

export const sameOptionValues = (a: Record<string, string>, b: Record<string, string>): boolean =>
  Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([key, value]) => b[key] === value)

/**
 * Checks submitted customization values against configured rules. Lengths are
 * counted as Unicode code points; submitted strings are never trimmed. Pass the
 * chosen variant's option values to apply `appliesWhen` (normalise first).
 * An empty rule array is well-formed but cannot accept values.
 */
export function validateCustomizationValues(rules: unknown, values: unknown, variantValues?: Record<string, string>): string | null {
  const configurationError = customizationRulesValidation(rules)
  if (configurationError) return configurationError
  if (!Array.isArray(rules) || rules.length === 0) return 'Customization is not configured.'
  if (!isRecord(values)) return 'Customization values must be an object.'
  const active = variantValues === undefined ? rules as CustomizationRule[] : applicableRules(rules as CustomizationRule[], variantValues)

  const expectedKeys = new Set(active.map((rule) => rule.key))
  for (const key of Object.keys(values)) {
    if (!expectedKeys.has(key)) return `Unexpected customization value "${key}".`
  }

  for (const rule of active) {
    const hasValue = Object.hasOwn(values, rule.key)
    if (!hasValue) {
      if (rule.required) return `Customization value "${rule.key}" is required.`
      continue
    }

    const value = values[rule.key]
    if (typeof value !== 'string') return `Customization value "${rule.key}" must be a string.`
    if (rule.required && value.length === 0) return `Customization value "${rule.key}" is required.`

    if (rule.type === 'select') {
      if (!findChoice(rule, value)) return `Customization value "${rule.key}" must match an available option.`
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
