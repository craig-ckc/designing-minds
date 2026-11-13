import type { ReactNode } from 'react'
import { Checkbox } from '../ui/checkbox'

export function TermsCheckbox({ checked, onChange, disabled, children }: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled: boolean
  children: ReactNode
}) {
  return <Checkbox id="accepted-terms" name="acceptedTerms" required checked={checked}
    onCheckedChange={(value) => onChange(value === true)} disabled={disabled}
    className="rounded-md bg-surface-alt p-4 text-body" boxClassName="rounded-sm" label={children} />
}
