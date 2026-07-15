export function Logo({ className }: { className?: string }) {
  return (
    <svg width="100%" viewBox="0 0 100 42" className={className} aria-hidden>
      <use href="/logo.svg#designing-minds-logo" />
    </svg>
  )
}
