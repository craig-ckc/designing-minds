import { type ReactNode } from 'react'

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-body-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  )
}
