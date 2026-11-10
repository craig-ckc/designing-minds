import { useId } from 'react'
import type { PhysicalVariantDraft } from '@designing-minds/cms'
import { cn, CARD, FIELD_HELP, FIELD_LABEL } from '../../design'
import { Button, Input, Switch } from '../primitives'

type EditableVariant = PhysicalVariantDraft & { stockAdjustment?: { expectedOnHand: number; newOnHand: number } }

export function PhysicalVariantsField({ value, productId, disabled, onChange }: {
  value: unknown
  productId: string
  disabled?: boolean
  onChange: (variants: EditableVariant[]) => void
}) {
  const fieldId = useId()
  const variants = Array.isArray(value) ? value as EditableVariant[] : []
  const update = (index: number, variant: EditableVariant) => onChange(variants.map((current, i) => i === index ? variant : current))
  const removeNew = (index: number) => onChange(variants.filter((_, i) => i !== index))
  return <div className="grid gap-3">
    <p className={FIELD_HELP}>Add each option shoppers can order. Existing options stay attached to this product; switch an option off to stop selling it.</p>
    {variants.map((variant, index) => {
      const originalCount = Number(variant.onHand ?? 0)
      const shownCount = variant.stockAdjustment?.newOnHand ?? originalCount
      const isPersisted = Boolean((variant as EditableVariant & { _persisted?: boolean })._persisted)
      const activeId = `${fieldId}-variant-${index}-active`
      const optionEntries = Object.entries(variant.optionValues ?? {})
      const writeOptions = (entries: [string, string][]) => update(index, { ...variant, optionValues: Object.fromEntries(entries) })
      return <article key={variant.id} className={cn(CARD, 'grid gap-3 p-3')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1"><span className={FIELD_LABEL}>SKU (optional)</span><Input value={variant.sku ?? ''} disabled={disabled} onChange={(e) => update(index, { ...variant, sku: e.target.value || null })} /></label>
          <label className="grid gap-1"><span className={FIELD_LABEL}>Price override (ZAR, optional)</span><Input type="number" min="0" step="0.01" value={variant.unitPriceZar ?? ''} disabled={disabled} onChange={(e) => update(index, { ...variant, unitPriceZar: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        </div>
        <div className="grid gap-2">
          <span className={FIELD_LABEL}>Option choices</span>
          {optionEntries.map(([key, optionValue], optionIndex) => <div key={`${variant.id}:${optionIndex}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input aria-label="Option name" placeholder="Colour" value={key} disabled={disabled} onChange={(e) => { const next = [...optionEntries]; next[optionIndex] = [e.target.value, optionValue]; writeOptions(next) }} />
            <Input aria-label="Option value" placeholder="Blue" value={optionValue} disabled={disabled} onChange={(e) => { const next = [...optionEntries]; next[optionIndex] = [key, e.target.value]; writeOptions(next) }} />
            {!disabled ? <Button variant="outline" size="sm" aria-label="Remove option" onClick={() => writeOptions(optionEntries.filter((_, i) => i !== optionIndex))}>Remove</Button> : null}
          </div>)}
          {!disabled ? <div><Button variant="outline" size="sm" onClick={() => writeOptions([...optionEntries, ['', '']])}>Add option choice</Button></div> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1"><span className={FIELD_LABEL}>Stock on hand</span><Input type="number" min="0" step="1" value={Number.isFinite(shownCount) ? shownCount : ''} disabled={disabled} onChange={(e) => {
            const nextOnHand = e.target.value === '' ? Number.NaN : Number(e.target.value)
            if (!isPersisted) return update(index, { ...variant, onHand: nextOnHand })
            update(index, nextOnHand === originalCount ? { ...variant, stockAdjustment: undefined } : { ...variant, stockAdjustment: { expectedOnHand: originalCount, newOnHand: nextOnHand } })
          }} />{isPersisted ? <span className={FIELD_HELP}>Current stock: {originalCount}. A saved change is checked against this count.</span> : null}</label>
          <label htmlFor={activeId} className={cn('flex min-h-11 items-center gap-2 self-end pb-1', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <Switch id={activeId} checked={variant.active} disabled={disabled} onCheckedChange={(active) => update(index, { ...variant, active })} />
            <span className={FIELD_LABEL}>Available to shoppers</span>
            <span className="sr-only">for {variant.sku ? `SKU ${variant.sku}` : `option ${index + 1}`}</span>
          </label>
        </div>
        {!isPersisted && !disabled ? <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => removeNew(index)}>Remove option</Button></div> : null}
      </article>
    })}
    {!disabled ? <div><Button variant="outline" size="sm" onClick={() => onChange([...variants, { id: crypto.randomUUID(), productId, sku: null, optionValues: {}, unitPriceZar: null, active: true, sortOrder: variants.length + 1, onHand: 0 }])}>Add product option</Button></div> : null}
  </div>
}
