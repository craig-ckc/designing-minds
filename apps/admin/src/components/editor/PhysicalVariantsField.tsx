import { useCallback, useId, useRef, useState } from 'react'
import type { PhysicalVariantDraft } from '@designing-minds/cms'
import { cn, CARD, FIELD_HELP, FIELD_LABEL } from '../../design'
import { Button, Input, Switch } from '../primitives'
import { Icon } from '../ui'

export function PhysicalVariantsField({ value, productId, disabled, onChange }: {
  value: unknown
  productId: string
  disabled?: boolean
  onChange: (variants: PhysicalVariantDraft[]) => void
}) {
  const variants = Array.isArray(value) ? value as PhysicalVariantDraft[] : []
  const focusAddedOption = useRef(false)
  const focusOptionHeading = useCallback((heading: HTMLHeadingElement | null) => {
    if (!heading || !focusAddedOption.current) return
    focusAddedOption.current = false
    heading.focus()
  }, [])

  function addOption() {
    focusAddedOption.current = true
    onChange([...variants, {
      id: crypto.randomUUID(),
      productId,
      sku: null,
      optionValues: {},
      unitPriceZar: null,
      active: true,
      sortOrder: variants.length + 1,
      onHand: 0,
    }])
  }

  return (
    <div className="grid max-w-6xl gap-3">
      <p className={FIELD_HELP}>
        {variants.length === 0
          ? 'Add one option for each version you sell. A product without variations still needs one option.'
          : 'Turn off availability to stop selling a saved option.'}
      </p>
      {variants.map((variant, index) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          number={index + 1}
          disabled={disabled}
          headingRef={index === variants.length - 1 ? focusOptionHeading : undefined}
          onChange={(next) => onChange(variants.map((current) => current.id === variant.id ? next : current))}
          onRemove={() => onChange(variants.filter((current) => current.id !== variant.id))}
        />
      ))}
      {!disabled ? (
        <Button type="button" variant="outline" className="w-fit" onClick={addOption}>
          <span className="size-3.5"><Icon name="plus" /></span>
          Add product option
        </Button>
      ) : null}
    </div>
  )
}

function VariantCard({ variant, number, disabled, headingRef, onChange, onRemove }: {
  variant: PhysicalVariantDraft
  number: number
  disabled?: boolean
  headingRef?: (heading: HTMLHeadingElement | null) => void
  onChange: (variant: PhysicalVariantDraft) => void
  onRemove: () => void
}) {
  const id = useId()
  const [duplicateChoice, setDuplicateChoice] = useState<{ index: number; input: string | null } | null>(null)
  const focusAddedChoice = useRef(false)
  const focusChoiceName = useCallback((input: HTMLInputElement | null) => {
    if (!input || !focusAddedChoice.current) return
    focusAddedChoice.current = false
    input.focus()
  }, [])
  const choices = Object.entries(variant.optionValues ?? {})
  const completeChoices = choices.every(([name, value]) => name.trim() && value.trim())
  const choiceSummary = choices.map(([, value]) => value.trim()).filter(Boolean).join(' / ')
  const originalCount = Number(variant.onHand ?? 0)
  const shownCount = variant.stockAdjustment?.newOnHand ?? originalCount

  function writeChoices(entries: [string, string][]) {
    setDuplicateChoice(null)
    onChange({ ...variant, optionValues: Object.fromEntries(entries) })
  }

  function editChoice(index: number, name: string, value: string) {
    if (choices.some(([other], i) => i !== index && other === name)) {
      setDuplicateChoice({ index, input: name })
      return
    }
    writeChoices(choices.map((choice, i) => i === index ? [name, value] : choice))
  }

  function addChoice() {
    focusAddedChoice.current = true
    writeChoices([...choices, ['', '']])
  }

  function changeStock(value: string) {
    const newOnHand = value === '' ? Number.NaN : Number(value)
    if (!variant._persisted) {
      onChange({ ...variant, onHand: newOnHand })
      return
    }
    onChange({
      ...variant,
      stockAdjustment: newOnHand === originalCount ? undefined : { expectedOnHand: originalCount, newOnHand },
    })
  }

  return (
    <article aria-labelledby={`${id}-heading`} className={cn(CARD, '@container min-w-0')}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-t-card border-b border-line bg-surface-alt px-3 py-2">
        <h4 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className="min-w-0 wrap-anywhere text-ui font-semibold">
          Option {number}
          {choiceSummary ? <span className="font-normal text-ink-soft"> · {choiceSummary}</span> : null}
        </h4>
        <label htmlFor={`${id}-active`} className={cn('flex min-h-field items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
          <Switch id={`${id}-active`} checked={variant.active} disabled={disabled} onCheckedChange={(active) => onChange({ ...variant, active })} />
          <span className={FIELD_LABEL}>Available to shoppers</span>
          <span className="sr-only">for {variant.sku ? `SKU ${variant.sku}` : `option ${number}`}</span>
        </label>
      </header>
      <div className="grid items-start gap-4 p-3 @min-[40rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <fieldset className="grid min-w-0 gap-2">
          <legend className="mb-2 text-ui font-semibold">Choices</legend>
          {choices.length === 0 ? <p className={FIELD_HELP}>Add a choice such as colour or size if shoppers need to select one.</p> : null}
          {choices.map(([name, value], index) => (
            <div key={index} className="grid gap-1">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                <label className="grid min-w-0 gap-1">
                  <span className={FIELD_LABEL}>Option name</span>
                  <Input
                    ref={index === choices.length - 1 ? focusChoiceName : undefined}
                    placeholder="e.g. Colour"
                    value={duplicateChoice?.index === index ? duplicateChoice.input ?? name : name}
                    disabled={disabled}
                    aria-invalid={duplicateChoice?.index === index && duplicateChoice.input !== null ? true : undefined}
                    aria-describedby={duplicateChoice?.index === index ? `${id}-choice-error` : undefined}
                    onChange={(e) => editChoice(index, e.target.value, value)}
                    onBlur={() => {
                      if (duplicateChoice?.index === index) setDuplicateChoice({ index, input: null })
                    }}
                  />
                </label>
                <label className="grid min-w-0 gap-1">
                  <span className={FIELD_LABEL}>Option value</span>
                  <Input placeholder="e.g. Blue" value={value} disabled={disabled} onChange={(e) => editChoice(index, name, e.target.value)} />
                </label>
                {!disabled ? (
                  <Button type="button" variant="ghost" size="icon" title="Remove choice" aria-label={`Remove choice ${index + 1}`} onClick={() => writeChoices(choices.filter((_, i) => i !== index))}>
                    <span className="size-3.5"><Icon name="trash" /></span>
                  </Button>
                ) : null}
              </div>
              {duplicateChoice?.index === index ? (
                <p id={`${id}-choice-error`} role="status" className="text-ui text-danger">
                  That choice name is already used in this option.{duplicateChoice.input === null ? ' The previous name was kept.' : ''}
                </p>
              ) : null}
            </div>
          ))}
          {!disabled ? (
            <div className="grid gap-1">
              <Button type="button" variant="outline" className="w-fit" disabled={!completeChoices} onClick={addChoice}>
                <span className="size-3.5"><Icon name="plus" /></span>
                Add choice
              </Button>
              {!completeChoices ? <p className={FIELD_HELP}>Complete the name and value before adding another choice.</p> : null}
            </div>
          ) : null}
        </fieldset>
        <div className="grid min-w-0 content-start gap-3 border-t border-line pt-3 @min-[40rem]:border-t-0 @min-[40rem]:border-l @min-[40rem]:pl-4 @min-[40rem]:pt-0">
          <div className="grid gap-1">
            <label htmlFor={`${id}-stock`} className={FIELD_LABEL}>Stock on hand</label>
            <Input id={`${id}-stock`} type="number" min="0" step="1" className="max-w-40" value={Number.isFinite(shownCount) ? shownCount : ''} disabled={disabled} aria-describedby={variant._persisted ? `${id}-stock-help` : undefined} onChange={(e) => changeStock(e.target.value)} />
            {variant._persisted ? (
              <p id={`${id}-stock-help`} className={FIELD_HELP}>Saved stock: {originalCount}.{variant.stockAdjustment ? ' Save the product to update stock.' : ''}</p>
            ) : null}
          </div>
          <div className="grid gap-3 @min-[52rem]:grid-cols-2">
            <label className="grid min-w-0 gap-1">
              <span className={FIELD_LABEL}>SKU <span className="text-muted">(optional)</span></span>
              <Input value={variant.sku ?? ''} disabled={disabled} onChange={(e) => onChange({ ...variant, sku: e.target.value || null })} />
            </label>
            <label className="grid min-w-0 gap-1">
              <span className={FIELD_LABEL}>Price override (ZAR)</span>
              <Input type="number" min="0" step="0.01" placeholder="Use product price" value={variant.unitPriceZar ?? ''} disabled={disabled} onChange={(e) => onChange({ ...variant, unitPriceZar: e.target.value === '' ? null : Number(e.target.value) })} />
            </label>
          </div>
        </div>
      </div>
      {!variant._persisted && !disabled ? (
        <footer className="flex justify-end border-t border-line px-3 py-2">
          <Button type="button" variant="ghost" className="text-danger" onClick={onRemove}>Remove product option</Button>
        </footer>
      ) : null}
    </article>
  )
}
