import { type ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-body-sm font-medium">
      {label}
      {children}
    </label>
  )
}
