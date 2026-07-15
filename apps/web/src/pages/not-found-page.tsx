import { Link } from 'react-router-dom'
import { Section } from '../components/ui/section'
import { Icon } from '../components/ui/icon'
import { Button } from '../components/ui/button'

// Shown for any route React Router can't match. On Vercel this only renders
// once the SPA fallback rewrite serves index.html for the deep link (see
// apps/web/vercel.json); without that rewrite the CDN 404s before React loads.
const SUGGESTIONS = [
  { to: '/shop', label: 'All resources', sub: 'Browse the full CAPS-aligned catalogue' },
  { to: '/packages', label: 'Bundles & plans', sub: 'Save with a term or full-year plan' },
  { to: '/grades', label: 'Browse by grade', sub: 'Grades 3 to 7' },
  { to: '/help', label: 'Help & FAQs', sub: 'Answers to common questions' },
]

export function NotFoundPage() {
  return (
    <Section>
        <div className="mx-auto max-w-prose text-center">
          <h1 className="mt-3">Page not found</h1>
          <p className="mt-4 lead">
            The page you’re looking for doesn’t exist or may have moved. Check the address, or pick up from one of these
            instead.
          </p>
          <div className="mt-7 flex justify-center">
            <Button to="/" variant="solid">
              Back to home
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-readable grid-cols-1 gap-4 sm:grid-cols-2">
          {SUGGESTIONS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center justify-between gap-3 rounded-card border border-line p-5 transition hover:border-primary"
            >
              <span>
                <span className="block font-medium text-ink">{item.label}</span>
                <span className="block text-label text-muted">{item.sub}</span>
              </span>
              <span className="h-4 w-4 flex-none text-muted transition group-hover:text-ink">
                <Icon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
    </Section>
  )
}
