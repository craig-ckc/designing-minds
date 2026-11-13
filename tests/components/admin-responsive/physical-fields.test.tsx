import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import type { CustomizationRule, PhysicalVariantDraft, VariantOptionDefinition } from '@designing-minds/cms'
import { CustomizationRulesField } from '../../../apps/admin/src/components/editor/CustomizationRulesField'
import { PhysicalVariantsField } from '../../../apps/admin/src/components/editor/PhysicalVariantsField'
import { VariantOptionsField } from '../../../apps/admin/src/components/editor/VariantOptionsField'
import { BILLABLE_LETTERS, LETTERS, syncVariants } from '../../../apps/admin/src/cms/physical-product-edit'

/* The physical-product editors follow Shopify/Webflow (options as chips,
   variants created for every combination, compact rows) and Etsy
   (personalisation questions with instructions and simple limits). */

const colours: VariantOptionDefinition[] = [{ key: 'colour', label: 'Colour', display: 'swatches', values: [{ value: 'Pink', swatch: '#f3a0c2' }, { value: 'Blue' }] }]
const pink: PhysicalVariantDraft = { id: 'pink', productId: 'product', sku: 'KEYRING-PINK', optionValues: { colour: 'Pink' }, unitPriceZar: null, active: true, sortOrder: 1, inventoryPolicy: 'tracked', onHand: 12 }
const blue: PhysicalVariantDraft = { id: 'blue', productId: 'product', sku: 'KEYRING-BLUE', optionValues: { colour: 'Blue' }, unitPriceZar: null, active: false, sortOrder: 2, inventoryPolicy: 'tracked', onHand: 9 }

/* ------------------------------ Variants -------------------------------- */

it('labels each variant’s availability switch by its choices and changes only that variant', () => {
  const onChange = vi.fn()
  render(<PhysicalVariantsField value={[pink, blue]} options={colours} productId="product" onChange={onChange} />)
  expect(screen.getByRole('switch', { name: /Available to shoppers: Blue/ })).toBeTruthy()
  fireEvent.click(within(screen.getByRole('row', { name: 'Blue' })).getByText('Available'))
  expect(onChange).toHaveBeenLastCalledWith([pink, { ...blue, active: true }])
})

it('makes the rows read-only without emitting a change when disabled', () => {
  const onChange = vi.fn()
  render(<PhysicalVariantsField value={[pink, blue]} options={colours} productId="product" disabled onChange={onChange} />)
  const toggle = screen.getByRole('switch', { name: /Available to shoppers: Pink/ })
  expect(toggle.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(within(screen.getByRole('row', { name: 'Pink' })).getByText('Available'))
  expect(onChange).not.toHaveBeenCalled()
})

it('creates a variant for each new option value automatically', () => {
  function Editor() {
    const [options, setOptions] = useState(colours)
    const [variants, setVariants] = useState<PhysicalVariantDraft[]>([pink, blue])
    return <>
      <button type="button" onClick={() => setOptions([{ ...colours[0], values: [...colours[0].values, { value: 'Mint' }] }])}>add mint</button>
      <PhysicalVariantsField value={variants} options={options} productId="product" onChange={setVariants} />
    </>
  }
  render(<Editor />)
  expect(screen.getAllByRole('row')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: 'add mint' }))
  expect(screen.getByRole('row', { name: 'Mint' })).toBeTruthy()
})

it('offers, rather than silently adds, combinations an older product is missing', () => {
  const onChange = vi.fn()
  render(<PhysicalVariantsField value={[pink]} options={colours} productId="product" onChange={onChange} />)
  expect(screen.getByRole('status').textContent).toContain('One combination has no variant yet: Blue')
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Add it' }))
  expect(onChange).toHaveBeenLastCalledWith([pink, expect.objectContaining({ optionValues: { colour: 'Blue' }, active: true, inventoryPolicy: 'tracked' })])
})

it('switches a variant to made to order under More, replacing its stock count', () => {
  const onChange = vi.fn()
  const { rerender } = render(<PhysicalVariantsField value={[pink, blue]} options={colours} productId="product" onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: /More for Pink/ }))
  fireEvent.click(screen.getByText('Made to order (don’t count stock)'))
  expect(onChange).toHaveBeenLastCalledWith([{ ...pink, inventoryPolicy: 'made_to_order' }, blue])
  rerender(<PhysicalVariantsField value={[{ ...pink, inventoryPolicy: 'made_to_order' }, blue]} options={colours} productId="product" onChange={onChange} />)
  expect(screen.queryByRole('spinbutton', { name: 'Stock for Pink' })).toBeNull()
  expect(within(screen.getByRole('row', { name: 'Pink' })).getAllByText('Made to order').length).toBeGreaterThan(0)
})

it('records a checked stock adjustment for a saved variant and a plain count for a new one', () => {
  const onChange = vi.fn()
  const saved = { ...pink, _persisted: true }
  render(<PhysicalVariantsField value={[saved, blue]} options={colours} productId="product" onChange={onChange} />)
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Stock for Pink' }), { target: { value: '15' } })
  expect(onChange).toHaveBeenLastCalledWith([{ ...saved, stockAdjustment: { expectedOnHand: 12, newOnHand: 15 } }, blue])
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Stock for Blue' }), { target: { value: '4' } })
  expect(onChange).toHaveBeenLastCalledWith([saved, { ...blue, onHand: 4 }])
})

it('applies a price to every variant at once', () => {
  const onChange = vi.fn()
  render(<PhysicalVariantsField value={[pink, blue]} options={colours} productId="product" onChange={onChange} />)
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Price for all variants (ZAR)' }), { target: { value: '35' } })
  fireEvent.click(screen.getByRole('button', { name: 'Set price' }))
  expect(onChange).toHaveBeenLastCalledWith([{ ...pink, unitPriceZar: 35 }, { ...blue, unitPriceZar: 35 }])
})

it('gives saved variants a new option’s first value so their stock carries over, and never duplicates', () => {
  const saved = { ...pink, _persisted: true, optionValues: {} }
  const synced = syncVariants([saved], colours, 'product')
  expect(synced[0]).toMatchObject({ id: 'pink', optionValues: { colour: 'Pink' } })
  expect(synced.slice(1).map((variant) => variant.optionValues)).toEqual([{ colour: 'Blue' }])
})

it('takes back a value given in this draft when the new option is removed again', () => {
  const sizes: VariantOptionDefinition[] = [{ key: 'size', label: 'Size', values: [{ value: 'Small' }] }]
  const saved: PhysicalVariantDraft = { ...pink, id: 'small', optionValues: { size: 'Small' }, _persisted: true, _savedOptionValues: { size: 'Small' } }
  const withColour = syncVariants([saved], [...sizes, { key: 'colour', label: 'Colour', values: [{ value: 'Red' }] }], 'product')
  expect(withColour[0].optionValues).toEqual({ size: 'Small', colour: 'Red' })
  expect(syncVariants(withColour, sizes, 'product')[0].optionValues).toEqual({ size: 'Small' })
})

it('lets a new combination copy price and made-to-order from the variant it grew from', () => {
  const sizes: VariantOptionDefinition[] = [{ key: 'size', label: 'Size', values: [{ value: 'Large' }] }, { key: 'colour', label: 'Colour', values: [{ value: 'Red' }, { value: 'Blue' }] }]
  const large: PhysicalVariantDraft = { ...pink, id: 'large', optionValues: { size: 'Large' }, unitPriceZar: 235, inventoryPolicy: 'made_to_order', _persisted: true, _savedOptionValues: { size: 'Large' } }
  const synced = syncVariants([large], sizes, 'product')
  expect(synced.find((variant) => variant.optionValues.colour === 'Blue')).toMatchObject({ unitPriceZar: 235, inventoryPolicy: 'made_to_order', onHand: 0 })
})

/* ---------------------------- Product options ---------------------------- */

it('adds a Colour option shown as swatches and takes values as chips', () => {
  function Editor() {
    const [options, setOptions] = useState<VariantOptionDefinition[]>([])
    return <VariantOptionsField value={options} variants={[]} onChange={setOptions} />
  }
  render(<Editor />)
  fireEvent.click(screen.getByRole('button', { name: 'Add Colour option' }))
  expect((screen.getByRole('switch', { name: /Show as colour swatches/ })).getAttribute('aria-checked')).toBe('true')
  const input = screen.getByRole('textbox', { name: /Add a value/ })
  fireEvent.change(input, { target: { value: 'Pink' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  fireEvent.change(screen.getByRole('textbox', { name: /Add a value/ }), { target: { value: 'pink' } })
  fireEvent.keyDown(screen.getByRole('textbox', { name: /Add a value/ }), { key: 'Enter' })
  expect(screen.getByRole('status').textContent).toContain('already listed')
  expect(screen.getByRole('button', { name: 'Remove Pink' })).toBeTruthy()
  expect(screen.getByLabelText('Swatch colour for Pink')).toBeTruthy()
})

it('lets an option added in this draft be removed, after confirming', () => {
  const onChange = vi.fn()
  const saved: PhysicalVariantDraft = { ...pink, optionValues: { colour: 'Pink', size: 'S' }, _persisted: true, _savedOptionValues: { colour: 'Pink' } }
  render(<VariantOptionsField value={[colours[0], { key: 'size', label: 'Size', values: [{ value: 'S' }] }]} variants={[saved]} onChange={onChange} />)
  expect(screen.getByRole('button', { name: 'Remove S' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Remove option.*Size/ }))
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Remove Size' }))
  expect(onChange).toHaveBeenLastCalledWith([colours[0]])
})

it('suggests a swatch for common colour names', () => {
  function Editor() {
    const [options, setOptions] = useState<VariantOptionDefinition[]>([{ key: 'colour', label: 'Colour', display: 'swatches', values: [] }])
    return <><VariantOptionsField value={options} variants={[]} onChange={setOptions} /><output data-testid="options">{JSON.stringify(options)}</output></>
  }
  render(<Editor />)
  const input = screen.getByRole('textbox', { name: /Add a value/ })
  fireEvent.change(input, { target: { value: 'Pink' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(JSON.parse(screen.getByTestId('options').textContent!)[0].values).toEqual([{ value: 'Pink', swatch: '#ec4f9c' }])
})

it('keeps values and keys that saved variants rely on', () => {
  const onChange = vi.fn()
  render(<VariantOptionsField value={colours} variants={[{ ...pink, _persisted: true }]} onChange={onChange} />)
  expect(screen.queryByRole('button', { name: 'Remove Pink' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Remove Blue' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Remove option' })).toBeNull()
  fireEvent.change(screen.getByRole('textbox', { name: 'Option name' }), { target: { value: 'Frame colour' } })
  expect(onChange).toHaveBeenLastCalledWith([{ ...colours[0], label: 'Frame colour' }])
})

/* ------------------------- Personalisation questions --------------------- */

const nameRule: CustomizationRule = { key: 'name', label: 'Keyring name', type: 'text', required: true, constraints: { allowSpaces: false } }
const messageRule: CustomizationRule = { key: 'message', label: 'Gift message', type: 'text', required: false, constraints: { allowSpaces: false } }

it('labels each question’s switches by its question and changes only that question', () => {
  const onChange = vi.fn()
  render(<CustomizationRulesField value={[nameRule, messageRule]} onChange={onChange} />)
  expect(screen.getByRole('switch', { name: 'Required for Gift message' })).toBeTruthy()
  fireEvent.click(within(screen.getAllByRole('article')[1]).getByText('Required'))
  expect(onChange).toHaveBeenLastCalledWith([nameRule, { ...messageRule, required: true }])
  fireEvent.click(within(screen.getAllByRole('article')[0]).getByText('Allow spaces'))
  expect(onChange).toHaveBeenLastCalledWith([{ ...nameRule, constraints: { allowSpaces: true } }, messageRule])
})

it('disables every switch without changing a question', () => {
  const onChange = vi.fn()
  render(<CustomizationRulesField value={[nameRule]} disabled onChange={onChange} />)
  const required = screen.getByRole('switch', { name: 'Required for Keyring name' })
  expect(required.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(within(screen.getAllByRole('article')[0]).getByText('Required'))
  expect(onChange).not.toHaveBeenCalled()
})

it('generates a question key from its wording, focuses a new question, and stores instructions', () => {
  function Editor() {
    const [rules, setRules] = useState<CustomizationRule[]>([])
    return <><CustomizationRulesField value={rules} onChange={setRules} /><output data-testid="rules">{JSON.stringify(rules)}</output></>
  }
  render(<Editor />)
  fireEvent.click(screen.getByRole('button', { name: 'Add Text, like a name' }))
  const title = screen.getByRole('textbox', { name: 'Question shoppers see' })
  expect(document.activeElement).toBe(title)
  fireEvent.change(title, { target: { value: 'Teacher’s name' } })
  fireEvent.change(screen.getByRole('textbox', { name: /Instructions for shoppers/ }), { target: { value: 'e.g. Mrs Minnie' } })
  expect(JSON.parse(screen.getByTestId('rules').textContent!)).toEqual([
    { key: 'teachers_name', label: 'Teacher’s name', type: 'text', required: true, constraints: { allowSpaces: true }, help: 'e.g. Mrs Minnie' },
  ])
})

it('sets per-letter pricing from “Charge per letter” and letters-only from one switch', () => {
  const onChange = vi.fn()
  const onPricingChange = vi.fn()
  render(<CustomizationRulesField value={[{ ...nameRule, required: false }]} onChange={onChange} onPricingChange={onPricingChange} />)
  fireEvent.click(screen.getByText('Charge per letter'))
  expect(onChange).toHaveBeenLastCalledWith([{ ...nameRule, required: true }])
  expect(onPricingChange).toHaveBeenLastCalledWith('name', BILLABLE_LETTERS)
  fireEvent.click(screen.getByText('Letters only (A–Z)'))
  expect(onChange).toHaveBeenLastCalledWith([{ ...nameRule, required: false, constraints: { allowSpaces: false, allowedCharacters: LETTERS } }])
})

it('asks a question only for chosen option values and warns when none are chosen', () => {
  const onChange = vi.fn()
  const sizes: VariantOptionDefinition[] = [{ key: 'size', label: 'Size', values: [{ value: 'Small' }, { value: 'Large' }] }]
  const teacher: CustomizationRule = { key: 'teacher', label: 'Teacher name', type: 'text', required: true, appliesWhen: { size: [] } }
  render(<CustomizationRulesField value={[teacher]} variantOptions={sizes} onChange={onChange} />)
  expect(screen.getByRole('status').textContent).toContain('never asked')
  fireEvent.click(screen.getByRole('button', { name: 'Large' }))
  expect(onChange).toHaveBeenLastCalledWith([{ ...teacher, appliesWhen: { size: ['Large'] } }])
})

it('stores plain choices as text and priced choices as objects', () => {
  const onChange = vi.fn()
  const style: CustomizationRule = { key: 'style', label: 'Letter style', type: 'select', required: false, options: ['Classic', 'Rounded'] }
  render(<CustomizationRulesField value={[style]} onChange={onChange} />)
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Extra price for Rounded' }), { target: { value: '9.95' } })
  expect(onChange).toHaveBeenLastCalledWith([{ ...style, options: ['Classic', { value: 'Rounded', priceDeltaZar: 9.95 }] }])
})
