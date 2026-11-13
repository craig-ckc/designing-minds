import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { sameOptionValues, variantConforms, type PhysicalVariantDraft, type VariantOptionDefinition } from '@designing-minds/cms'
import { savedOptionValues, syncVariants, usableOptions as usable } from '../../cms/physical-product-edit'
import { cn, FIELD_HELP, FIELD_LABEL } from '../../design'
import { Button, Input, Select, Switch } from '../primitives'

/**
 * The sellable versions of a physical product as compact rows — modelled on
 * Webflow's variants table and Shopify's variant list: price, stock (or made to
 * order) and availability per row; SKU under "More"; one bar to apply a price,
 * a stock count or made-to-order to every variant at once.
 */
export function PhysicalVariantsField({ value, options: declared, productId, basePrice, perLetter = false, disabled, onChange }: {
  value: unknown
  options?: unknown
  productId: string
  /** The product price, shown as each row's default. */
  basePrice?: unknown
  /** Per-letter pricing: prices are per letter. */
  perLetter?: boolean
  disabled?: boolean
  onChange: (variants: PhysicalVariantDraft[]) => void
}) {
  const variants = Array.isArray(value) ? value as PhysicalVariantDraft[] : []
  const options = Array.isArray(declared) ? declared as VariantOptionDefinition[] : []
  const signature = JSON.stringify(usable(options).map((option) => [option.key, option.values.map((entry) => entry.value)]))
  const lastSignature = useRef<string | null>(null)

  useEffect(() => {
    if (disabled) return
    const first = lastSignature.current === null
    lastSignature.current = signature
    // On open, only fill an empty product; afterwards, follow option edits.
    if (first && variants.length > 0) return
    const next = syncVariants(variants, options, productId)
    if (next.length !== variants.length || next.some((variant, index) => variant.id !== variants[index]?.id)) onChange(next)
  }, [signature]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, next: PhysicalVariantDraft) => onChange(variants.map((current) => current.id === id ? next : current))
  // Combinations without a variant (e.g. an older product) are offered, not added silently on open.
  const synced = syncVariants(variants, options, productId)
  const missing = synced.filter((variant) => !variants.some((current) => current.id === variant.id))
  const price = typeof basePrice === 'number' && Number.isFinite(basePrice) ? basePrice : null
  const single = usable(options).length === 0
  const priceHeading = perLetter ? 'Price per letter (ZAR)' : 'Price (ZAR)'
  // Saved variants that picked up a new option's first value in this draft.
  const adopted = variants.filter((variant) => {
    const saved = savedOptionValues(variant)
    return saved && usable(options).some((option) => !Object.hasOwn(saved, option.key))
  })

  return (
    <div className="@container grid max-w-6xl gap-3">
      <p className={FIELD_HELP}>
        {single
          ? 'Sold in one version. Add product options above to sell several.'
          : 'One row per combination, created from the options above. Turn off “Available” for any you don’t sell.'}
        {' '}Leave a price blank to use the product price{perLetter ? ' per letter' : ''}.
      </p>
      {!disabled && adopted.length > 0 ? (
        <p role="status" className="rounded-control border border-line bg-surface-alt px-3 py-2 text-ui">
          Your saved {adopted.length === 1 ? 'variant was' : 'variants were'} given the first value of the new option ({adopted.map((variant) => Object.values(variant.optionValues).join(' · ')).join(', ')}), keeping {adopted.length === 1 ? 'its' : 'their'} stock. Change it under More if that’s wrong.
        </p>
      ) : null}
      {!disabled && missing.length > 0 && variants.length > 0 ? (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-surface-alt px-3 py-2 text-ui">
          <span>{missing.length === 1 ? 'One combination has' : `${missing.length} combinations have`} no variant yet: {missing.map((variant) => Object.values(variant.optionValues).join(' · ')).join(', ')}.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(synced)}>Add {missing.length === 1 ? 'it' : 'them'}</Button>
        </div>
      ) : null}
      {!disabled && variants.length > 1 ? <ApplyToAll variants={variants} perLetter={perLetter} onChange={onChange} /> : null}
      <div role="table" aria-label="Variants" className="grid rounded-control border border-line">
        <div role="row" className="hidden gap-3 border-b border-line bg-surface-alt px-3 py-1.5 text-ui text-ink-soft @min-[44rem]:grid @min-[44rem]:grid-cols-[minmax(0,1.5fr)_8rem_10rem_auto_auto]">
          <span role="columnheader">Variant</span>
          <span role="columnheader">{priceHeading}</span>
          <span role="columnheader">Stock</span>
          <span role="columnheader">Available</span>
          <span role="columnheader"><span className="sr-only">More</span></span>
        </div>
        {variants.length === 0 && !disabled ? (
          <div role="row" className="px-3 py-2"><span role="cell"><Button type="button" variant="outline" size="sm" onClick={() => onChange(syncVariants([], options, productId))}>Add variant</Button></span></div>
        ) : null}
        {variants.map((variant, index) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            options={options}
            single={single}
            basePrice={price}
            priceLabel={priceHeading}
            duplicate={variant.active && variants.slice(0, index).some((earlier) => earlier.active && sameOptionValues(earlier.optionValues ?? {}, variant.optionValues ?? {}))}
            disabled={disabled}
            onChange={(next) => update(variant.id, next)}
          />
        ))}
      </div>
    </div>
  )
}

function ApplyToAll({ variants, perLetter, onChange }: { variants: PhysicalVariantDraft[]; perLetter: boolean; onChange: (variants: PhysicalVariantDraft[]) => void }) {
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const priceInput = useRef<HTMLInputElement>(null)
  const stockInput = useRef<HTMLInputElement>(null)
  const allMadeToOrder = variants.every((variant) => variant.inventoryPolicy === 'made_to_order')
  // Focus stays in the field after applying, so keyboard users keep their place.
  const applyPrice = () => { if (price === '') return; onChange(variants.map((variant) => ({ ...variant, unitPriceZar: Number(price) }))); setPrice(''); priceInput.current?.focus() }
  const applyStock = () => { if (stock === '') return; onChange(variants.map((variant) => withStock({ ...variant, inventoryPolicy: 'tracked' }, Number(stock)))); setStock(''); stockInput.current?.focus() }
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-control bg-surface-alt p-2">
      <span className={cn(FIELD_LABEL, 'self-center')}>Apply to all variants:</span>
      <div className="flex items-end gap-1">
        <Input ref={priceInput} aria-label={perLetter ? 'Price per letter for all variants (ZAR)' : 'Price for all variants (ZAR)'} type="number" min="0" step="0.01" placeholder={perLetter ? 'Per letter' : 'Price'} className="w-24" value={price} onChange={(event) => setPrice(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); applyPrice() } }} />
        <Button type="button" variant="outline" size="sm" disabled={price === ''} onClick={applyPrice}>Set price</Button>
      </div>
      <div className="flex items-end gap-1">
        <Input ref={stockInput} aria-label="Stock for all variants" type="number" min="0" step="1" placeholder="Stock" className="w-24" value={stock} onChange={(event) => setStock(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); applyStock() } }} />
        <Button type="button" variant="outline" size="sm" disabled={stock === ''} onClick={applyStock}>Set stock</Button>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(variants.map((variant) => ({ ...variant, inventoryPolicy: allMadeToOrder ? 'tracked' : 'made_to_order' })))}>
        {allMadeToOrder ? 'Count stock for all' : 'Make all made to order'}
      </Button>
    </div>
  )
}

/** Saved variants record an explicit adjustment the database checks; new ones set the count. */
function withStock(variant: PhysicalVariantDraft, newOnHand: number): PhysicalVariantDraft {
  if (!variant._persisted) return { ...variant, onHand: newOnHand }
  const original = Number(variant.onHand ?? 0)
  return { ...variant, stockAdjustment: newOnHand === original ? undefined : { expectedOnHand: original, newOnHand } }
}

function VariantRow({ variant, options, single, basePrice, priceLabel, duplicate, disabled, onChange }: {
  variant: PhysicalVariantDraft
  options: VariantOptionDefinition[]
  single: boolean
  basePrice: number | null
  priceLabel: string
  duplicate?: boolean
  disabled?: boolean
  onChange: (variant: PhysicalVariantDraft) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const values = variant.optionValues ?? {}
  const declared = usable(options)
  const name = single ? 'This product' : declared.map((option) => values[option.key]).filter(Boolean).join(' · ') || 'Unnamed variant'
  const swatch = declared.find((option) => option.display === 'swatches')
  const swatchColour = swatch ? swatch.values.find((entry) => entry.value === values[swatch.key])?.swatch : undefined
  const offered = single ? Object.keys(values).length === 0 : variantConforms(declared, values)
  const madeToOrder = variant.inventoryPolicy === 'made_to_order'
  const originalCount = Number(variant.onHand ?? 0)
  const shownCount = variant.stockAdjustment?.newOnHand ?? originalCount
  const cell = 'grid gap-1 @min-[44rem]:block'
  const label = cn(FIELD_LABEL, '@min-[44rem]:sr-only')

  return (
    <div role="row" aria-labelledby={`${id}-name`} className={cn('grid gap-3 border-b border-line px-3 py-2 last:border-b-0 @min-[44rem]:grid-cols-[minmax(0,1.5fr)_8rem_10rem_auto_auto] @min-[44rem]:items-center', !variant.active && 'bg-surface-alt/60')}>
      <div role="cell" className="flex min-w-0 items-center gap-2">
        {swatch ? <span aria-hidden="true" className="size-4 flex-none rounded-full border border-ink/20" style={{ backgroundColor: swatchColour ?? 'transparent' }} /> : null}
        <span id={`${id}-name`} className="min-w-0 wrap-anywhere text-ui font-medium">{name}</span>
        {!offered && variant.active ? <span className="text-ui text-warn">No longer offered — turn off</span> : null}
        {duplicate ? <span className="text-ui text-warn">Same choices as another variant — turn one off</span> : null}
      </div>
      <label role="cell" className={cell}>
        <span className={label}>{priceLabel}</span>
        <Input
          aria-label={`Price for ${name}`}
          type="number" min="0" step="0.01"
          placeholder={basePrice != null ? String(basePrice) : 'Product price'}
          value={variant.unitPriceZar ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ ...variant, unitPriceZar: event.target.value === '' ? null : Number(event.target.value) })}
        />
      </label>
      <div role="cell" className={cell}>
        <span className={label}>Stock</span>
        <div className="flex items-center gap-2">
          {madeToOrder ? (
            <span className="text-ui text-ink-soft">Made to order</span>
          ) : (
            <Input
              aria-label={`Stock for ${name}`}
              type="number" min="0" step="1" className="w-20"
              value={Number.isFinite(shownCount) ? shownCount : ''}
              disabled={disabled}
              onChange={(event) => onChange(withStock(variant, event.target.value === '' ? Number.NaN : Number(event.target.value)))}
            />
          )}
        </div>
      </div>
      <label role="cell" htmlFor={`${id}-active`} className={cn('flex items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
        <Switch id={`${id}-active`} checked={variant.active} disabled={disabled} onCheckedChange={(active) => onChange({ ...variant, active })} />
        <span className={label}>Available</span>
        <span className="sr-only">Available to shoppers: {name}</span>
      </label>
      <div role="cell">
        <Button type="button" variant="ghost" size="sm" aria-expanded={open} aria-controls={`${id}-more`} onClick={() => setOpen(!open)}>
          {open ? 'Less' : 'More'}<span className="sr-only"> for {name}</span>
        </Button>
      </div>
      {open ? (
        <div id={`${id}-more`} className="grid gap-3 rounded-control bg-surface-alt p-3 @min-[44rem]:col-span-5 @min-[30rem]:grid-cols-2">
          {declared.map((option) => (
            <label key={option.key} className="grid gap-1">
              <span className={FIELD_LABEL}>{option.label}</span>
              <Select
                value={option.values.some((entry) => entry.value === values[option.key]) ? values[option.key] : ''}
                disabled={disabled}
                options={[
                  ...(option.values.some((entry) => entry.value === values[option.key]) ? [] : [{ label: values[option.key] ? `${values[option.key]} (no longer offered)` : 'Choose…', value: '' }]),
                  ...option.values.map((entry) => ({ label: entry.value, value: entry.value })),
                ]}
                onValueChange={(next) => onChange({ ...variant, optionValues: { ...values, [option.key]: next } })}
              />
            </label>
          ))}
          <label htmlFor={`${id}-made`} className={cn('flex min-h-field items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <Switch id={`${id}-made`} checked={madeToOrder} disabled={disabled} onCheckedChange={(on) => onChange({ ...variant, inventoryPolicy: on ? 'made_to_order' : 'tracked' })} />
            <span className={FIELD_LABEL}>Made to order (don’t count stock)</span>
          </label>
          <label className="grid gap-1">
            <span className={FIELD_LABEL}>SKU <span className="text-muted">(optional)</span></span>
            <Input value={variant.sku ?? ''} disabled={disabled} onChange={(event) => onChange({ ...variant, sku: event.target.value || null })} />
          </label>
          {variant._persisted && !madeToOrder ? <p className={FIELD_HELP}>Saved stock: {originalCount}.{variant.stockAdjustment ? ' Save the product to update stock.' : ''}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
