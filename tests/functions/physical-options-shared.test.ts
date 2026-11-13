import { describe, expect, it } from 'vitest'
import {
  billableLetterCount,
  normalizeCustomizations,
  physicalConfigurationValidation,
  physicalSelectionValidation,
  physicalUnitPriceZar,
  ruleApplies,
  sameOptionValues,
  variantCombinations,
  variantConforms,
  type CustomizationRule,
  type PhysicalCatalogProduct,
  type VariantOptionDefinition,
} from '../../packages/cms/src/index.ts'

/* The TypeScript mirror of private.physical_unit_price and the option checks
   in 2026-11-12-physical-options.sql; physical-options.test.ts proves the SQL
   side with the same numbers. */

const colours: VariantOptionDefinition[] = [{ key: 'colour', label: 'Colour', display: 'swatches', values: [{ value: 'Pink', swatch: '#f3a0c2' }, { value: 'Blue' }] }]
const keyringRules: CustomizationRule[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, transform: 'uppercase', constraints: { minLength: 1, maxLength: 10, allowedCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' } },
  { key: 'font', label: 'Letter style', type: 'select', required: false, options: [{ value: 'Classic' }, { value: 'Rounded', priceDeltaZar: 10 }] },
]
const keyring: PhysicalCatalogProduct = {
  id: 'k', slug: 'keyring', title: 'Keyring', shortDescription: '', fullDescription: '', productType: 'physical',
  priceZar: 30, pricingMode: 'per_character', pricingFieldKey: 'name', billableCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  customizationRules: keyringRules, galleryImages: [], published: true, variantOptions: colours,
  variants: [{ id: 'pink', sku: null, optionValues: { colour: 'Pink' }, unitPriceZar: null, available: true }],
}
const bagRules: CustomizationRule[] = [{ key: 'teacherName', label: 'Teacher’s name', type: 'text', required: true, appliesWhen: { size: ['Large'] }, constraints: { allowSpaces: true } }]
const bag: PhysicalCatalogProduct = {
  ...keyring, id: 'b', slug: 'bag', priceZar: 165, pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
  customizationRules: bagRules, variantOptions: [{ key: 'size', label: 'Size', values: [{ value: 'Small' }, { value: 'Large' }] }],
  variants: [
    { id: 'small', sku: null, optionValues: { size: 'Small' }, unitPriceZar: null, available: true },
    { id: 'large', sku: null, optionValues: { size: 'Large' }, unitPriceZar: 235, available: true, madeToOrder: true },
  ],
}

describe('pricing mirror', () => {
  it('counts billable letters whatever their case and adds paid choices once per item', () => {
    expect(billableLetterCount(keyring, { name: 'ava' })).toBe(3)
    expect(physicalUnitPriceZar(keyring, keyring.variants[0], { name: 'ava' })).toBe(90)
    expect(physicalUnitPriceZar(keyring, keyring.variants[0], { name: 'Ava', font: 'Rounded' })).toBe(100)
    expect(physicalUnitPriceZar(bag, bag.variants[1], { teacherName: 'Mrs Minnie' })).toBe(235)
  })

  it('validates a lowercase name once it is put into capitals', () => {
    expect(physicalSelectionValidation(keyring, 'pink', 1, { name: 'ava' })).toBeNull()
    expect(physicalSelectionValidation(keyring, 'pink', 1, { name: 'ava', font: 'Gothic' })).toMatch(/available option/)
    expect(physicalSelectionValidation(keyring, 'pink', 1, { name: '123' })).toMatch(/not allowed/)
  })

  it('asks the teacher’s name only for the Large bag and drops it otherwise', () => {
    expect(ruleApplies(bagRules[0], { size: 'Small' })).toBe(false)
    expect(normalizeCustomizations(bagRules, { teacherName: 'Mrs M' }, { size: 'Small' })).toEqual({})
    expect(physicalSelectionValidation(bag, 'small', 1, {})).toBeNull()
    expect(physicalSelectionValidation(bag, 'large', 1, {})).toMatch(/required/)
    expect(physicalSelectionValidation(bag, 'large', 1, { teacherName: 'Mrs Minnie' })).toBeNull()
  })
})

describe('configuration checks', () => {
  it('rejects questions that reuse an option key, depend on undeclared values, or gate per-letter pricing', () => {
    expect(physicalConfigurationValidation(colours, keyringRules, 'name')).toBeNull()
    expect(physicalConfigurationValidation(colours, [...keyringRules, { key: 'colour', label: 'Colour', type: 'text', required: false }], 'name')).toMatch(/same key/)
    expect(physicalConfigurationValidation(bag.variantOptions, [{ ...bagRules[0], appliesWhen: { size: ['Huge'] } }], null)).toMatch(/not offered/)
    expect(physicalConfigurationValidation(colours, [{ ...keyringRules[0], appliesWhen: { colour: ['Pink'] } }], 'name')).toMatch(/always be asked/)
    expect(physicalConfigurationValidation([{ key: 'colour', label: 'Colour', values: [{ value: 'Pink', swatch: 'pink' }] }], [], null)).toMatch(/swatches/)
  })

  it('accepts surcharges with cents, like R9.95', () => {
    for (const priceDeltaZar of [9.95, 19.99, 4.35]) {
      expect(physicalConfigurationValidation([], [{ key: 'style', label: 'Style', type: 'select', required: false, options: [{ value: 'Gold', priceDeltaZar }] }], null)).toBeNull()
    }
    expect(physicalConfigurationValidation([], [{ key: 'style', label: 'Style', type: 'select', required: false, options: [{ value: 'Gold', priceDeltaZar: 9.951 }] }], null)).toMatch(/two decimal/)
  })

  it('builds every combination and checks variants against the declared values', () => {
    const options: VariantOptionDefinition[] = [colours[0], { key: 'size', label: 'Size', values: [{ value: 'S' }, { value: 'M' }] }]
    expect(variantCombinations(options)).toEqual([
      { colour: 'Pink', size: 'S' }, { colour: 'Pink', size: 'M' }, { colour: 'Blue', size: 'S' }, { colour: 'Blue', size: 'M' },
    ])
    expect(variantCombinations([])).toEqual([])
    expect(variantConforms(options, { colour: 'Pink', size: 'M' })).toBe(true)
    expect(variantConforms(options, { colour: 'Green', size: 'M' })).toBe(false)
    expect(variantConforms(options, { colour: 'Pink' })).toBe(false)
    expect(sameOptionValues({ a: '1', b: '2' }, { b: '2', a: '1' })).toBe(true)
  })
})
