import { describe, expect, it } from 'vitest'
import {
  customizationRulesValidation,
  validateCustomizationValues,
  type CustomizationRule,
} from '../../packages/cms/src/lib/physical-products.ts'

describe('physical product customization rules', () => {
  it('accepts an empty rule array as well-formed but unconfigured', () => {
    expect(customizationRulesValidation([])).toBeNull()
    expect(validateCustomizationValues([], {})).toMatch(/not configured/)
  })

  it('accepts a valid text rule with literal character and length constraints and a select rule', () => {
    const rules: CustomizationRule[] = [
      {
        key: 'learner-name',
        label: 'Learner name',
        type: 'text',
        required: true,
        constraints: { minLength: 1, maxLength: 32, allowedCharacters: 'A-Z', allowSpaces: true },
      },
      { key: 'colour', label: 'Cover colour', type: 'select', required: false, options: ['Blue', 'Pink'] },
    ]

    expect(customizationRulesValidation(rules)).toBeNull()
  })

  it('rejects a non-array, malformed rule entries, and blank configuration labels or keys', () => {
    for (const invalid of [null, {}, 'not rules', [null], [{ key: '', label: 'Name', type: 'text', required: true }], [{ key: 'name', label: '  ', type: 'text', required: true }]]) {
      expect(customizationRulesValidation(invalid)).toEqual(expect.any(String))
    }
  })

  it('rejects duplicate keys, unknown fields, and fields belonging to the other rule type', () => {
    const validText = { key: 'name', label: 'Name', type: 'text', required: true }
    const validSelect = { key: 'colour', label: 'Colour', type: 'select', required: false, options: ['Blue'] }

    expect(customizationRulesValidation([validText, { ...validText }])).toMatch(/duplicated/)
    expect(customizationRulesValidation([{ ...validText, options: ['Blue'] }])).toMatch(/fields/)
    expect(customizationRulesValidation([{ ...validSelect, constraints: { minLength: 1 } }])).toMatch(/fields/)
    expect(customizationRulesValidation([{ ...validText, unexpected: true }])).toMatch(/fields/)
    expect(customizationRulesValidation([{ ...validText, constraints: { pattern: '.*' } }])).toMatch(/unknown fields/)
  })

  it('validates non-negative integer bounds and rejects an inverted length range', () => {
    expect(customizationRulesValidation([
      { key: 'code', label: 'Code', type: 'text', required: false, constraints: { minLength: 0, maxLength: 0 } },
    ])).toBeNull()

    for (const minLength of [-1, 1.5, '2']) {
      expect(customizationRulesValidation([
        { key: 'code', label: 'Code', type: 'text', required: false, constraints: { minLength } },
      ])).toMatch(/minLength/)
    }
    expect(customizationRulesValidation([
      { key: 'code', label: 'Code', type: 'text', required: false, constraints: { minLength: 3, maxLength: 2 } },
    ])).toMatch(/cannot exceed/)
  })

  it('matches the database integer boundary for text length constraints', () => {
    expect(customizationRulesValidation([
      { key: 'code', label: 'Code', type: 'text', required: false, constraints: { minLength: 2_147_483_647, maxLength: 2_147_483_647 } },
    ])).toBeNull()
    expect(customizationRulesValidation([
      { key: 'code', label: 'Code', type: 'text', required: false, constraints: { minLength: 2_147_483_648 } },
    ])).toMatch(/minLength/)
    expect(customizationRulesValidation([
      { key: 'code', label: 'Code', type: 'text', required: false, constraints: { maxLength: 2_147_483_648 } },
    ])).toMatch(/maxLength/)
  })

  it('requires select options to be a non-empty array of unique nonblank strings', () => {
    const select = (options: unknown) => ({ key: 'colour', label: 'Colour', type: 'select', required: true, options })

    expect(customizationRulesValidation([select([])])).toMatch(/non-empty array/)
    expect(customizationRulesValidation([select(['Blue', 'Blue'])])).toMatch(/unique/)
    expect(customizationRulesValidation([select(['Blue', '  '])])).toMatch(/non-empty strings/)
    expect(customizationRulesValidation([select(['Blue', 1])])).toMatch(/non-empty strings/)
  })
})

describe('physical product customization value validation', () => {
  it('counts Unicode code points for text length and preserves submitted values', () => {
    const rules = [{
      key: 'learner-name',
      label: 'Learner name',
      type: 'text',
      required: true,
      constraints: { minLength: 3, maxLength: 3, allowedCharacters: 'A😀', allowSpaces: true },
    }]

    // The emoji occupies two UTF-16 code units but one Unicode code point.
    expect(validateCustomizationValues(rules, { 'learner-name': 'A😀 ' })).toBeNull()
    expect(validateCustomizationValues(rules, { 'learner-name': 'A😀' })).toMatch(/shorter than minLength/)
    expect(validateCustomizationValues(rules, { 'learner-name': 'A😀  ' })).toMatch(/longer than maxLength/)
  })

  it('requires configured values and exact select-option membership', () => {
    const rules = [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'colour', label: 'Colour', type: 'select', required: true, options: ['Blue', 'Pink'] },
    ]

    expect(validateCustomizationValues(rules, {})).toMatch(/name.*required/)
    expect(validateCustomizationValues(rules, { name: 'A' })).toMatch(/colour.*required/)
    expect(validateCustomizationValues(rules, { name: 'A', colour: 'blue' })).toMatch(/available option/)
    expect(validateCustomizationValues(rules, { name: 'A', colour: 'Blue' })).toBeNull()
  })

  it('rejects unknown values and spaces unless explicitly permitted', () => {
    const rules = [{ key: 'name', label: 'Name', type: 'text', required: true }]

    expect(validateCustomizationValues(rules, { name: 'Ada', other: 'x' })).toMatch(/Unexpected/)
    expect(validateCustomizationValues(rules, { name: 'Ada Lovelace' })).toMatch(/cannot contain spaces/)
    expect(validateCustomizationValues([
      { ...rules[0], constraints: { allowedCharacters: 'AdaLovelace', allowSpaces: true } },
    ], { name: 'Ada Lovelace' })).toBeNull()
  })

  it('rejects values that violate literal allowed character sets without trimming or normalization', () => {
    const rules = [{
      key: 'initials',
      label: 'Initials',
      type: 'text',
      required: false,
      constraints: { allowedCharacters: 'ABC' },
    }]

    expect(validateCustomizationValues(rules, { initials: 'AB' })).toBeNull()
    expect(validateCustomizationValues(rules, { initials: 'Ab' })).toMatch(/not allowed/)
    expect(validateCustomizationValues(rules, { initials: ' A' })).toMatch(/cannot contain spaces/)
  })

  it('rejects non-string submitted values and malformed configuration before validating inputs', () => {
    expect(validateCustomizationValues([{ key: 'name', label: 'Name', type: 'text', required: true }], { name: 42 })).toMatch(/must be a string/)
    expect(validateCustomizationValues([{ key: 'name', label: 'Name', type: 'text', required: true, unexpected: true }], { name: 'Ada' })).toMatch(/fields/)
  })
})
