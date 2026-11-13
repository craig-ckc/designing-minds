import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { PhysicalVariantDraft, VariantOptionDefinition, VariantOptionValue } from '@designing-minds/cms'
import { cn, CARD, FIELD_HELP, FIELD_LABEL } from '../../design'
import { Button, Input, Switch } from '../primitives'
import { Icon } from '../ui'
import { guessSwatch, savedOptionValues, uniqueKey } from '../../cms/physical-product-edit'

const MAX_OPTIONS = 3
const PRESETS = ['Colour', 'Size', 'Style'] as const
const looksLikeColour = (label: string) => /colou?r|shade|finish/i.test(label)

/**
 * Stocked product options (Colour, Size) — modelled on Shopify and Webflow:
 * one entry point in plain words, values typed as chips, colour dots on colour
 * options. Variants below follow these automatically. Only values the server
 * already holds for a saved variant are locked; anything added in this draft
 * can be taken back.
 */
export function VariantOptionsField({ value, variants, disabled, onChange }: {
  value: unknown
  variants: unknown
  disabled?: boolean
  onChange: (options: VariantOptionDefinition[]) => void
}) {
  const options = Array.isArray(value) ? value as VariantOptionDefinition[] : []
  const saved = (Array.isArray(variants) ? variants as PhysicalVariantDraft[] : []).map(savedOptionValues).filter((entry): entry is Record<string, string> => entry !== null)
  const savedUses = (key: string, entry?: string) => saved.some((values) => Object.hasOwn(values, key) && (entry === undefined || values[key] === entry))
  const [focusValuesOf, setFocusValuesOf] = useState<number | null>(null)
  const addButtons = useRef<HTMLDivElement>(null)

  const update = (index: number, next: VariantOptionDefinition) => onChange(options.map((option, i) => i === index ? next : option))
  const add = (label: string) => {
    const key = uniqueKey(label || 'option', options.map((option) => option.key), 'option')
    onChange([...options, { key, label, display: looksLikeColour(label) ? 'swatches' : 'buttons', values: [] }])
    setFocusValuesOf(options.length)
  }
  const remove = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
    requestAnimationFrame(() => addButtons.current?.querySelector('button')?.focus())
  }

  function rename(index: number, label: string) {
    const option = options[index]
    // The key follows the name until a saved variant depends on it.
    const key = savedUses(option.key) ? option.key : uniqueKey(label || 'option', options.filter((_, i) => i !== index).map((entry) => entry.key), 'option')
    // A colour-like name switches swatches on; it never switches them off.
    update(index, { ...option, label, key, display: looksLikeColour(label) ? 'swatches' : option.display })
  }

  const unused = PRESETS.filter((preset) => !options.some((option) => option.label.toLowerCase() === preset.toLowerCase()))

  return (
    <div className="grid max-w-4xl gap-3">
      {options.length === 0 ? (
        <p className={FIELD_HELP}>Does this product come in different versions you stock separately, like colours or sizes? Add them here and the variants below are created for you.</p>
      ) : null}
      {options.map((option, index) => (
        <OptionCard
          key={index}
          option={option}
          disabled={disabled}
          focusValues={focusValuesOf === index}
          onFocused={() => setFocusValuesOf(null)}
          isSaved={(entry) => savedUses(option.key, entry)}
          onRename={(label) => rename(index, label)}
          onChange={(next) => update(index, next)}
          onRemove={savedUses(option.key) ? undefined : () => remove(index)}
        />
      ))}
      {!disabled && options.length < MAX_OPTIONS ? (
        <div ref={addButtons} className="flex flex-wrap items-center gap-2">
          <span className={FIELD_LABEL}>{options.length ? 'Add another option:' : 'Add an option:'}</span>
          {unused.map((preset) => (
            <Button key={preset} type="button" variant="outline" size="sm" onClick={() => add(preset)}>
              <span className="size-3"><Icon name="plus" /></span>
              <span className="sr-only">Add </span>{preset}<span className="sr-only"> option</span>
            </Button>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => add('')}>
            <span className="size-3"><Icon name="plus" /></span>
            <span className="sr-only">Add </span>Other option
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function OptionCard({ option, disabled, focusValues, onFocused, isSaved, onRename, onChange, onRemove }: {
  option: VariantOptionDefinition
  disabled?: boolean
  focusValues: boolean
  onFocused: () => void
  isSaved: (value: string) => boolean
  onRename: (label: string) => void
  onChange: (option: VariantOptionDefinition) => void
  onRemove?: () => void
}) {
  const id = useId()
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirming) confirmRef.current?.focus() }, [confirming])
  const swatches = option.display === 'swatches'
  const name = option.label || 'this option'
  return (
    <article aria-labelledby={`${id}-name`} className={cn(CARD, 'grid gap-3 p-3')}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-48 flex-1 gap-1">
          <span id={`${id}-name`} className={FIELD_LABEL}>Option name</span>
          <Input value={option.label} placeholder="e.g. Colour" disabled={disabled} onChange={(event) => onRename(event.target.value)} />
        </label>
        <label htmlFor={`${id}-swatches`} className={cn('flex min-h-field items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
          <Switch id={`${id}-swatches`} checked={swatches} disabled={disabled} onCheckedChange={(on) => onChange({ ...option, display: on ? 'swatches' : 'buttons' })} />
          <span className={FIELD_LABEL}>Show as colour swatches</span>
        </label>
        {!disabled && onRemove && !confirming ? <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={() => setConfirming(true)}>Remove option<span className="sr-only">: {name}</span></Button> : null}
      </div>
      {confirming && onRemove ? (
        <div role="group" aria-labelledby={`${id}-confirm`} className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-surface-alt px-3 py-2">
          <span id={`${id}-confirm`} className="text-ui">Remove {name}? The variants made from it, with their prices and stock, go too.</span>
          <Button ref={confirmRef} type="button" variant="solid" size="sm" onClick={onRemove}>Remove {name}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>Keep it</Button>
        </div>
      ) : null}
      <ValueChips
        id={id}
        values={option.values}
        swatches={swatches}
        disabled={disabled}
        autoFocus={focusValues}
        onFocused={onFocused}
        isSaved={isSaved}
        onChange={(values) => onChange({ ...option, values })}
      />
      {!onRemove && !disabled ? <p className={FIELD_HELP}>Saved variants use this option, so it stays. Turn those variants off to stop selling them.</p> : null}
    </article>
  )
}

/** Values as chips: type, then Enter or comma. Backspace on an empty field removes the last unsaved value. */
function ValueChips({ id, values, swatches, disabled, autoFocus, onFocused, isSaved, onChange }: {
  id: string
  values: VariantOptionValue[]
  swatches: boolean
  disabled?: boolean
  autoFocus: boolean
  onFocused: () => void
  isSaved: (value: string) => boolean
  onChange: (values: VariantOptionValue[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const attach = useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input
    if (input && autoFocus) { input.focus(); onFocused() }
  }, [autoFocus, onFocused])
  const present = values.filter((entry) => entry.value.trim())

  const commit = () => {
    const next = draft.trim()
    if (!next) return
    if (values.some((entry) => entry.value.toLowerCase() === next.toLowerCase())) {
      setNotice(`“${next}” is already listed.`)
      return
    }
    const swatch = swatches ? guessSwatch(next) : undefined
    onChange([...present, swatch ? { value: next, swatch } : { value: next }])
    setDraft('')
    setNotice(null)
  }
  const removeAt = (index: number) => {
    onChange(present.filter((_, i) => i !== index))
    inputRef.current?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && !draft) {
      const last = present.at(-1)
      if (last && !isSaved(last.value)) onChange(present.slice(0, -1))
    }
  }
  return (
    <div className="grid gap-1">
      <span id={`${id}-values`} className={FIELD_LABEL}>Values</span>
      <div className="flex min-h-field flex-wrap items-center gap-1.5 rounded-control border border-line-strong bg-surface px-2 py-1">
        <ul aria-labelledby={`${id}-values`} className="contents">
          {present.map((entry, index) => {
            const saved = isSaved(entry.value)
            return (
              <li key={entry.value} className="flex items-center gap-1 rounded-full border border-line bg-surface-alt py-0.5 pr-0.5 pl-1.5 text-ui">
                {swatches ? (
                  <label className="relative flex size-6 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary" title={`Colour for ${entry.value}`}>
                    <span aria-hidden="true" className="size-4 rounded-full border border-ink/20" style={{ backgroundColor: entry.swatch ?? 'transparent', backgroundImage: entry.swatch ? undefined : 'repeating-linear-gradient(45deg, #ddd 0 2px, transparent 2px 4px)' }} />
                    <input
                      type="color"
                      aria-label={`Swatch colour for ${entry.value}`}
                      className="absolute inset-0 size-6 cursor-pointer opacity-0"
                      value={entry.swatch ?? '#cccccc'}
                      disabled={disabled}
                      onChange={(event) => onChange(present.map((current, i) => i === index ? { ...current, swatch: event.target.value } : current))}
                    />
                  </label>
                ) : null}
                <span>{entry.value}</span>
                {!disabled && !saved ? (
                  <button type="button" aria-label={`Remove ${entry.value}`} className="flex size-6 items-center justify-center rounded-full text-ink-soft hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-primary" onClick={() => removeAt(index)}>
                    <span aria-hidden="true">×</span>
                  </button>
                ) : saved ? <span className="pr-1.5"><span className="sr-only">(used by a saved variant)</span></span> : null}
              </li>
            )
          })}
        </ul>
        {!disabled ? (
          <input
            ref={attach}
            aria-label={`Add a value${present.length ? '' : ', e.g. Pink'}`}
            className="min-w-28 flex-1 bg-transparent py-0.5 text-ui outline-none placeholder:text-muted"
            placeholder={present.length ? 'Add another…' : swatches ? 'Type a colour, then Enter' : 'Type a value, then Enter'}
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setNotice(null) }}
            onKeyDown={onKeyDown}
            onBlur={commit}
          />
        ) : null}
      </div>
      {notice ? <p role="status" className="text-ui text-warn">{notice}</p> : swatches && present.some((entry) => !entry.swatch) ? <p className={FIELD_HELP}>Click a dot to choose its colour.</p> : null}
    </div>
  )
}
