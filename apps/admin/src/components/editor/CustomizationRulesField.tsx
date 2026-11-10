import { useId } from 'react'
import type { CustomizationRule, TextCustomizationConstraints } from '@designing-minds/cms'
import { cn, FIELD_HELP, FIELD_LABEL, CARD } from '../../design'
import { Button, Input, Select, Switch, Textarea } from '../primitives'

const constraintsWithoutEmpty = (value: TextCustomizationConstraints): TextCustomizationConstraints =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))

export function CustomizationRulesField({ value, onChange, disabled }: {
  value: unknown
  onChange: (rules: CustomizationRule[]) => void
  disabled?: boolean
}) {
  const fieldId = useId()
  const rules = Array.isArray(value) ? value as CustomizationRule[] : []
  const update = (index: number, rule: CustomizationRule) => onChange(rules.map((current, i) => i === index ? rule : current))
  return <div className="grid gap-3">
    <p className={FIELD_HELP}>Tell shoppers what they can personalize, such as the name to print or a choice of colour.</p>
    {rules.map((rule, index) => {
      const ruleName = rule.label || rule.key || `question ${index + 1}`
      const requiredId = `${fieldId}-rule-${index}-required`
      const spacesId = `${fieldId}-rule-${index}-allow-spaces`
      return <article key={index} className={cn(CARD, 'grid gap-3 p-3')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1"><span className={FIELD_LABEL}>Shopper-facing label</span><Input value={rule.label} disabled={disabled} onChange={(e) => update(index, { ...rule, label: e.target.value })} /></label>
        <label className="grid gap-1"><span className={FIELD_LABEL}>Field key</span><Input value={rule.key} disabled={disabled} onChange={(e) => update(index, { ...rule, key: e.target.value })} /></label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1"><span className={FIELD_LABEL}>Answer type</span><Select value={rule.type} disabled={disabled} options={[{ label: 'Text', value: 'text' }, { label: 'Choose from a list', value: 'select' }]} onValueChange={(type) => update(index, type === 'select' ? { key: rule.key, label: rule.label, type: 'select', required: rule.required, options: [''] } : { key: rule.key, label: rule.label, type: 'text', required: rule.required })} /></label>
        <label htmlFor={requiredId} className={cn('flex min-h-11 items-center gap-2 pb-1', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
          <Switch id={requiredId} checked={rule.required} disabled={disabled} onCheckedChange={(required) => update(index, { ...rule, required })} />
          <span className={FIELD_LABEL}>Answer required</span>
          <span className="sr-only">for {ruleName}</span>
        </label>
      </div>
      {rule.type === 'text' ? <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1"><span className={FIELD_LABEL}>Minimum characters</span><Input type="number" min="0" value={rule.constraints?.minLength ?? ''} disabled={disabled} onChange={(e) => update(index, { ...rule, constraints: constraintsWithoutEmpty({ ...rule.constraints, minLength: e.target.value === '' ? undefined : Number(e.target.value) }) })} /></label>
        <label className="grid gap-1"><span className={FIELD_LABEL}>Maximum characters</span><Input type="number" min="0" value={rule.constraints?.maxLength ?? ''} disabled={disabled} onChange={(e) => update(index, { ...rule, constraints: constraintsWithoutEmpty({ ...rule.constraints, maxLength: e.target.value === '' ? undefined : Number(e.target.value) }) })} /></label>
        <label className="grid gap-1 sm:col-span-2"><span className={FIELD_LABEL}>Allowed characters</span><Input value={rule.constraints?.allowedCharacters ?? ''} disabled={disabled} placeholder="Leave blank to allow any character" onChange={(e) => update(index, { ...rule, constraints: constraintsWithoutEmpty({ ...rule.constraints, allowedCharacters: e.target.value || undefined }) })} /></label>
        <label htmlFor={spacesId} className={cn('flex min-h-11 items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
          <Switch id={spacesId} checked={rule.constraints?.allowSpaces ?? false} disabled={disabled} onCheckedChange={(allowSpaces) => update(index, { ...rule, constraints: { ...rule.constraints, allowSpaces } })} />
          <span className={FIELD_LABEL}>Allow spaces</span>
          <span className="sr-only">for {ruleName}</span>
        </label>
      </div> : <label className="grid gap-1"><span className={FIELD_LABEL}>Choices, one per line</span><Textarea value={rule.options.join('\n')} disabled={disabled} onChange={(e) => update(index, { ...rule, options: e.target.value.split('\n') })} /></label>}
      {!disabled ? <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => onChange(rules.filter((_, i) => i !== index))}>Remove question</Button></div> : null}
      </article>
    })}
    {!disabled ? <div><Button variant="outline" size="sm" onClick={() => onChange([...rules, { key: '', label: '', type: 'text', required: false }])}>Add personalization question</Button></div> : null}
  </div>
}
