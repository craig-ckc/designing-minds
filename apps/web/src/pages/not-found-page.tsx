import { Section } from '../components/ui/section'
import { Button } from '../components/ui/button'
import { SuggestionLink } from '../components/ui/suggestion-link'

// Shown for any route React Router can't match. On Vercel this only renders
// once the SPA fallback rewrite serves index.html for the deep link (see
// apps/web/vercel.json); without that rewrite the CDN 404s before React loads.
const NOT_FOUND_SUGGESTIONS = [
  { to: '/shop', title: 'All resources', description: 'Browse the full CAPS-aligned catalogue' },
  { to: '/packages', title: 'Bundles & plans', description: 'Save with a term or full-year plan' },
  { to: '/grades', title: 'Browse by grade', description: 'Grades 3 to 7' },
  { to: '/help', title: 'Help & FAQs', description: 'Answers to common questions' },
]

export function NotFoundPage() {
  return (
    <Section>
      <div className="mx-auto max-w-prose text-center">
        <h1 className="mt-3 text-h1">Page not found</h1>
        <p className="mt-4 lead">
          The page you’re looking for doesn’t exist or may have moved. Check the address, or pick up from one of these
          instead.
        </p>
        <div className="mt-8 flex justify-center">
          <Button to="/" variant="solid">
            Back to home
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-readable grid-cols-1 gap-4 sm:grid-cols-2">
        {NOT_FOUND_SUGGESTIONS.map((item) => (
          <SuggestionLink key={item.to} {...item} />
        ))}
      </div>
    </Section>
  )
}
