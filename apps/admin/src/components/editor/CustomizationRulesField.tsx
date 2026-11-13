import { useCallback, useId, useRef, type ReactNode } from 'react'
import { choiceDetails, type CustomizationChoice, type CustomizationRule, type SelectCustomizationRule, type TextCustomizationConstraints, type TextCustomizationRule, type VariantOptionDefinition } from '@designing-minds/cms'
import { cn, FIELD_HELP, FIELD_LABEL, CARD } from '../../design'
import { Button, Input, Select, Switch, Textarea } from '../primitives'
import { Icon } from '../ui'
import { BILLABLE_LETTERS, LETTERS, uniqueKey } from '../../cms/physical-product-edit'

const withoutEmpty = (value: TextCustomizationConstraints): TextCustomizationConstraints | undefined => {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined)
  return entries.length ? Object.fromEntries(entries) : undefined
}

/** Store plain strings when a choice has no extras, so simple lists stay simple. */
const compactChoice = (choice: CustomizationChoice): SelectCustomizationRule['options'][number] => {
  const extras = Object.fromEntries(Object.entries(choice).filter(([key, entry]) => key !== 'value' && entry !== undefined && entry !== ''))
  return Object.keys(extras).length ? { value: choice.value, ...extras } : choice.value
}

/** Drop a key from a rule without leaving `undefined` behind. */
function omit<T extends object>(value: T, key: string): T {
  const copy = { ...value } as Record<string, unknown>
  delete copy[key]
  return copy as T
}

/**
 * Personalisation questions, modelled on Etsy's custom options: a short list
 * of fields, each with a question, instructions shoppers see, and simple
 * limits. Technical settings (field key, exact characters) sit under "More
 * settings". "Charge per letter" on a text question sets per-letter pricing.
 */
export function CustomizationRulesField({ value, variantOptions, pricingFieldKey = null, billableCharacters = null, onPricingChange, onChange, disabled }: {
  value: unknown
  variantOptions?: unknown
  /** The question charged per letter, when the product is priced per letter. */
  pricingFieldKey?: string | null
  billableCharacters?: string | null
  onPricingChange?: (key: string | null, billableCharacters?: string | null) => void
  onChange: (rules: CustomizationRule[]) => void
  disabled?: boolean
}) {
  const rules = Array.isArray(value) ? value as CustomizationRule[] : []
  const options = (Array.isArray(variantOptions) ? variantOptions as VariantOptionDefinition[] : [])
    .filter((option) => option.key && option.values.some((entry) => entry.value.trim()))
  const focusNew = useRef(false)
  const focusTitle = useCallback((input: HTMLInputElement | null) => {
    if (!input || !focusNew.current) return
    focusNew.current = false
    input.focus()
  }, [])
  const takenKeys = (index: number) => [...rules.filter((_, i) => i !== index).map((rule) => rule.key), ...options.map((option) => option.key)]
  const update = (index: number, rule: CustomizationRule) => onChange(rules.map((current, i) => i === index ? rule : current))

  function relabel(index: number, rule: CustomizationRule, label: string) {
    // The key follows the question while it still matches the generated one.
    const generated = uniqueKey(rule.label, takenKeys(index), 'question')
    const key = !rule.key || rule.key === generated ? uniqueKey(label, takenKeys(index), 'question') : rule.key
    if (key !== rule.key && rule.key === pricingFieldKey) onPricingChange?.(key)
    update(index, { ...rule, label, key })
  }

  function add(type: 'text' | 'select') {
    focusNew.current = true
    onChange([...rules, type === 'text'
      ? { key: '', label: '', type: 'text', required: true, constraints: { allowSpaces: true } }
      : { key: '', label: '', type: 'select', required: true, options: [''] }])
  }

  const listRef = useRef<HTMLDivElement>(null)
  function remove(index: number) {
    if (rules[index].key === pricingFieldKey) onPricingChange?.(null)
    onChange(rules.filter((_, i) => i !== index))
    // Keep keyboard users in place: the next question, or the add buttons.
    requestAnimationFrame(() => {
      const titles = listRef.current?.querySelectorAll<HTMLInputElement>('[data-question-title]')
      const next = titles?.[Math.min(index, (titles?.length ?? 1) - 1)]
      ;(next ?? listRef.current?.querySelector<HTMLButtonElement>('[data-add-question]'))?.focus()
    })
  }

  return <div ref={listRef} className="grid max-w-4xl gap-3">
    <p className={FIELD_HELP}>{rules.length ? 'Ask one thing per question. Shoppers see the question and your instructions on the product page.' : 'Let shoppers personalise this product — for example the name to print, or a letter style.'}</p>
    {rules.map((rule, index) => (
      <QuestionCard
        key={index}
        rule={rule}
        number={index + 1}
        options={options}
        charged={rule.key !== '' && rule.key === pricingFieldKey}
        billableCharacters={billableCharacters}
        titleRef={index === rules.length - 1 ? focusTitle : undefined}
        disabled={disabled}
        onRelabel={(label) => relabel(index, rule, label)}
        onChange={(next) => update(index, next)}
        onCharge={(on) => {
          if (on) { update(index, { ...rule, required: true }); onPricingChange?.(rule.key || null, billableCharacters || BILLABLE_LETTERS) }
          else onPricingChange?.(null)
        }}
        onBillable={(letters) => onPricingChange?.(rule.key, letters)}
        onRemove={() => remove(index)}
      />
    ))}
    {!disabled ? <div className="flex flex-wrap items-center gap-2">
      <span className={FIELD_LABEL}>Add a question:</span>
      <Button type="button" variant="outline" size="sm" data-add-question="" onClick={() => add('text')}><span className="size-3"><Icon name="plus" /></span><span className="sr-only">Add </span>Text, like a name</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => add('select')}><span className="size-3"><Icon name="plus" /></span><span className="sr-only">Add </span>List of choices, like a letter style</Button>
    </div> : null}
  </div>
}

function QuestionCard({ rule, number, options, charged, billableCharacters, titleRef, disabled, onRelabel, onChange, onCharge, onBillable, onRemove }: {
  rule: CustomizationRule
  number: number
  options: VariantOptionDefinition[]
  charged: boolean
  billableCharacters: string | null
  titleRef?: (input: HTMLInputElement | null) => void
  disabled?: boolean
  onRelabel: (label: string) => void
  onChange: (rule: CustomizationRule) => void
  onCharge: (on: boolean) => void
  onBillable: (letters: string) => void
  onRemove: () => void
}) {
  const id = useId()
  const name = rule.label || `question ${number}`
  const switchRow = (key: string, label: ReactNode, checked: boolean, change: (on: boolean) => void, hint?: string) => (
    <label htmlFor={`${id}-${key}`} className={cn('flex min-h-field flex-wrap items-center gap-x-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
      <Switch id={`${id}-${key}`} checked={checked} disabled={disabled} onCheckedChange={change} />
      <span className={FIELD_LABEL}>{label}</span>
      <span className="sr-only">for {name}</span>
      {hint ? <span className={cn(FIELD_HELP, 'basis-full pl-9')}>{hint}</span> : null}
    </label>
  )
  return <article aria-labelledby={`${id}-title`} className={cn(CARD, 'grid gap-3 p-3')}>
    <div className="flex flex-wrap items-end gap-3">
      <span className="mb-2 rounded-full bg-surface-alt px-2 py-0.5 text-ui text-ink-soft">{rule.type === 'text' ? 'Text answer' : 'List of choices'}</span>
      <label className="grid min-w-56 flex-1 gap-1">
        <span id={`${id}-title`} className={FIELD_LABEL}>Question shoppers see</span>
        <Input ref={titleRef} data-question-title="" value={rule.label} placeholder={rule.type === 'text' ? 'e.g. Child’s name' : 'e.g. Letter style'} disabled={disabled} onChange={(event) => onRelabel(event.target.value)} />
      </label>
      {switchRow('required', 'Required', rule.required, (required) => onChange({ ...rule, required }))}
    </div>
    <label className="grid gap-1">
      <span className={FIELD_LABEL}>Instructions for shoppers <span className="text-muted">(optional)</span></span>
      <Textarea
        rows={2}
        value={rule.help ?? ''}
        maxLength={300}
        placeholder={rule.type === 'text' ? 'e.g. Enter the name exactly as it should appear' : 'e.g. See the photos for each style'}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value ? { ...rule, help: event.target.value } : omit(rule, 'help'))}
      />
    </label>
    {rule.type === 'text'
      ? <TextSettings rule={rule} name={name} charged={charged} disabled={disabled} switchRow={switchRow} onChange={onChange} onCharge={onCharge} />
      : <ChoicesEditor rule={rule} name={name} disabled={disabled} onChange={onChange} />}
    {options.length > 0 && !charged ? <AskOnlyFor rule={rule} name={name} options={options} disabled={disabled} onChange={onChange} /> : null}
    {options.length > 0 && charged ? <p className={FIELD_HELP}>A question charged per letter is asked for every version.</p> : null}
    <details className="group rounded-control border border-line">
      <summary className="cursor-pointer list-none px-3 py-2 text-ui text-ink-soft marker:hidden">More settings</summary>
      <div className="grid gap-3 border-t border-line p-3 sm:grid-cols-2">
        <label className="grid gap-1"><span className={FIELD_LABEL}>Field key</span><Input value={rule.key} disabled={disabled} onChange={(event) => onChange({ ...rule, key: event.target.value })} /><span className={FIELD_HELP}>Labels this answer on orders. Set automatically from the question.</span></label>
        {rule.type === 'text' ? <>
          <label className="grid gap-1"><span className={FIELD_LABEL}>Minimum characters</span><Input type="number" min="0" value={rule.constraints?.minLength ?? ''} disabled={disabled} onChange={(event) => onChange(withConstraints(rule, { minLength: event.target.value === '' ? undefined : Number(event.target.value) }))} /></label>
          <label className="grid gap-1 sm:col-span-2"><span className={FIELD_LABEL}>Exact characters allowed</span><Input value={rule.constraints?.allowedCharacters ?? ''} disabled={disabled} placeholder="Any character" onChange={(event) => onChange(withConstraints(rule, { allowedCharacters: event.target.value || undefined }))} /><span className={FIELD_HELP}>Type every character a shopper may use, e.g. ABCDEFGHIJKLMNOPQRSTUVWXYZ. “Letters only” fills this for you.</span></label>
          {charged ? <label className="grid gap-1 sm:col-span-2"><span className={FIELD_LABEL}>Characters that are charged</span><Input value={billableCharacters ?? BILLABLE_LETTERS} disabled={disabled} onChange={(event) => onBillable(event.target.value)} /><span className={FIELD_HELP}>Each of these adds the product price once. Upper and lower case count the same.</span></label> : null}
        </> : <label className="grid gap-1"><span className={FIELD_LABEL}>Show choices as</span><Select value={rule.display ?? 'buttons'} disabled={disabled}
          options={[{ label: 'Buttons', value: 'buttons' }, { label: 'Colour swatches', value: 'swatches' }, { label: 'Dropdown', value: 'dropdown' }]}
          onValueChange={(display) => onChange({ ...rule, display: display as SelectCustomizationRule['display'] })} /></label>}
      </div>
    </details>
    {!disabled ? <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-danger" onClick={onRemove}>Remove question<span className="sr-only">: {name}</span></Button></div> : null}
  </article>
}

const withConstraints = (rule: TextCustomizationRule, change: TextCustomizationConstraints): TextCustomizationRule => {
  const constraints = withoutEmpty({ ...rule.constraints, ...change })
  return constraints ? { ...rule, constraints } : omit(rule, 'constraints')
}

function TextSettings({ rule, name, charged, disabled, switchRow, onChange, onCharge }: {
  rule: TextCustomizationRule
  name: string
  charged: boolean
  disabled?: boolean
  switchRow: (key: string, label: ReactNode, checked: boolean, change: (on: boolean) => void, hint?: string) => ReactNode
  onChange: (rule: CustomizationRule) => void
  onCharge: (on: boolean) => void
}) {
  const lettersOnly = rule.constraints?.allowedCharacters === LETTERS || rule.constraints?.allowedCharacters === LETTERS.slice(0, 26)
  return <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
    <label className="grid max-w-48 content-start gap-1 self-start">
      <span className={FIELD_LABEL}>Character limit</span>
      <Input type="number" min="1" placeholder="No limit" aria-label={`Character limit for ${name}`} value={rule.constraints?.maxLength ?? ''} disabled={disabled}
        onChange={(event) => onChange(withConstraints(rule, { maxLength: event.target.value === '' ? undefined : Number(event.target.value) }))} />
      {charged && rule.constraints?.maxLength === undefined ? <span className="text-ui text-warn">Set a limit — every letter adds to the price.</span> : null}
    </label>
    <div className="grid content-start gap-1">
      {switchRow('letters', 'Letters only (A–Z)', lettersOnly, (on) => onChange(withConstraints(rule, { allowedCharacters: on ? LETTERS : undefined })))}
      {switchRow('spaces', 'Allow spaces', rule.constraints?.allowSpaces === true, (allowSpaces) => onChange(withConstraints(rule, { allowSpaces })))}
      {switchRow('capitals', 'Capital letters only', rule.transform === 'uppercase', (on) => onChange(on ? { ...rule, transform: 'uppercase' } : omit(rule, 'transform')), 'Typing is shown in capitals')}
      {switchRow('charge', 'Charge per letter', charged, onCharge, charged ? 'The product price is charged for each letter' : undefined)}
    </div>
  </div>
}

function AskOnlyFor({ rule, name, options, disabled, onChange }: {
  rule: CustomizationRule
  name: string
  options: VariantOptionDefinition[]
  disabled?: boolean
  onChange: (rule: CustomizationRule) => void
}) {
  const id = useId()
  const key = rule.appliesWhen ? Object.keys(rule.appliesWhen)[0] : undefined
  const option = options.find((entry) => entry.key === key) ?? options[0]
  const chosen = key ? rule.appliesWhen?.[key] ?? [] : []
  const toggle = (value: string) => {
    const next = chosen.includes(value) ? chosen.filter((entry) => entry !== value) : [...chosen, value]
    onChange({ ...rule, appliesWhen: { [option.key]: next } })
  }
  return <div className="grid gap-2">
    <label htmlFor={`${id}-only`} className={cn('flex min-h-field items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
      <Switch id={`${id}-only`} checked={Boolean(key)} disabled={disabled} onCheckedChange={(on) => onChange(on ? { ...rule, appliesWhen: { [options[0].key]: [] } } : omit(rule, 'appliesWhen'))} />
      <span className={FIELD_LABEL}>Ask only for some versions</span>
      <span className="sr-only">: {name}</span>
    </label>
    {key ? <div className="grid gap-2 pl-9">
      {options.length > 1 ? <label className="grid max-w-56 gap-1"><span className={FIELD_LABEL}>Depends on</span><Select value={option.key} disabled={disabled}
        options={options.map((entry) => ({ label: entry.label, value: entry.key }))}
        onValueChange={(next) => onChange({ ...rule, appliesWhen: { [next]: [] } })} /></label> : null}
      <div role="group" aria-label={`Ask “${name}” only when ${option.label} is`} className="flex flex-wrap items-center gap-1.5">
        <span className={FIELD_HELP}>Ask when {option.label} is:</span>
        {option.values.filter((entry) => entry.value.trim()).map((entry) => {
          const on = chosen.includes(entry.value)
          return <button key={entry.value} type="button" aria-pressed={on} disabled={disabled}
            className={cn('rounded-full border px-2.5 py-0.5 text-ui transition-colors disabled:cursor-not-allowed', on ? 'border-primary bg-primary text-on-primary' : 'border-line-strong bg-surface text-ink hover:border-primary')}
            onClick={() => toggle(entry.value)}>{entry.value}</button>
        })}
      </div>
      {chosen.length === 0 ? <p role="status" className="text-ui text-warn">Pick at least one {option.label.toLowerCase()}, or this question is never asked.</p> : null}
    </div> : null}
  </div>
}

function ChoicesEditor({ rule, name, disabled, onChange }: { rule: SelectCustomizationRule; name: string; disabled?: boolean; onChange: (rule: SelectCustomizationRule) => void }) {
  const choices = rule.options.map(choiceDetails)
  const focusNew = useRef(false)
  const focusChoice = useCallback((input: HTMLInputElement | null) => {
    if (!input || !focusNew.current) return
    focusNew.current = false
    input.focus()
  }, [])
  const write = (next: CustomizationChoice[]) => onChange({ ...rule, options: next.map(compactChoice) })
  const set = (index: number, choice: CustomizationChoice) => write(choices.map((current, i) => i === index ? choice : current))
  return <fieldset className="grid gap-2">
    <legend className={cn(FIELD_LABEL, 'mb-1')}>Choices</legend>
    {choices.map((choice, index) => {
      const label = choice.value || `choice ${index + 1}`
      return <div key={index} className="flex flex-wrap items-center gap-2">
        <Input ref={index === choices.length - 1 ? focusChoice : undefined} aria-label={`Choice ${index + 1} for ${name}`} className="min-w-40 flex-1" value={choice.value} placeholder="e.g. Rounded" disabled={disabled} onChange={(event) => set(index, { ...choice, value: event.target.value })} />
        <label className="flex items-center gap-1">
          <span className={FIELD_HELP}>+ R</span>
          <Input type="number" min="0" step="0.01" className="w-20" aria-label={`Extra price for ${label}`} placeholder="0" value={choice.priceDeltaZar ?? ''} disabled={disabled} onChange={(event) => set(index, { ...choice, priceDeltaZar: event.target.value === '' ? undefined : Number(event.target.value) })} />
        </label>
        <label className="relative flex size-6 cursor-pointer items-center justify-center" title={`Colour for ${label}`}>
          <span aria-hidden="true" className="size-5 rounded-full border border-ink/20" style={{ backgroundColor: choice.swatch ?? 'transparent', backgroundImage: choice.swatch ? undefined : 'repeating-linear-gradient(45deg, #ddd 0 2px, transparent 2px 4px)' }} />
          <input type="color" aria-label={`Colour swatch for ${label} (optional)`} className="absolute inset-0 cursor-pointer opacity-0" value={choice.swatch ?? '#cccccc'} disabled={disabled} onChange={(event) => set(index, { ...choice, swatch: event.target.value })} />
        </label>
        {choice.swatch && !disabled ? <Button type="button" variant="ghost" size="sm" onClick={() => set(index, { ...choice, swatch: undefined })}>No colour<span className="sr-only"> for {label}</span></Button> : null}
        {!disabled && choices.length > 1 ? <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={() => write(choices.filter((_, i) => i !== index))}>Remove<span className="sr-only"> {label}</span></Button> : null}
      </div>
    })}
    {!disabled ? <div><Button type="button" variant="outline" size="sm" disabled={choices.some((choice) => !choice.value.trim())} onClick={() => { focusNew.current = true; write([...choices, { value: '' }]) }}>Add choice</Button></div> : null}
  </fieldset>
}
