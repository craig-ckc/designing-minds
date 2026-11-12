import { Link } from 'react-router-dom'
import { ArrowAffordance } from './icon'

/** A "go here instead" link: title, one-line description and an arrow (code twin of Figma's SuggestionLink). */
export function SuggestionLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-5 transition-colors hover:border-line-strong"
    >
      <span>
        <span className="block text-body font-medium text-ink">{title}</span>
        <span className="block text-label text-muted">{description}</span>
      </span>
      <ArrowAffordance size="md" className="flex-none text-muted group-hover:text-ink" />
    </Link>
  )
}
