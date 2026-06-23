import { Link } from 'react-router-dom'

export function Breadcrumb({ trail, current }: { trail: { to: string; label: string }[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-[0.88rem] text-muted">
      {trail.map((crumb) => (
        <span key={crumb.to} className="flex items-center gap-2">
          <Link to={crumb.to} className="hover:text-ink">
            {crumb.label}
          </Link>
          <span aria-hidden className="text-line-strong">
            /
          </span>
        </span>
      ))}
      <span aria-current="page">{current}</span>
    </nav>
  )
}
