export function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <li className={`flex justify-between gap-3 text-body-sm ${last ? '' : 'border-b border-line pb-3'}`}>
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </li>
  )
}
