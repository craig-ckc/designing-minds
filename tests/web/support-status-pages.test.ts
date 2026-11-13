import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('404, unsubscribe and checkout status pages share the H1 + lead + mt-8 action rhythm', () => {
  for (const path of ['pages/not-found-page.tsx', 'pages/checkout-return-page.tsx', 'pages/checkout-cancel-page.tsx']) {
    const source = read(path)
    assert.match(source, /<h1 className="mt-3 text-h1">/, path)
    assert.match(source, /<p className="mt-4 lead">/, path)
    assert.match(source, /<div className="mt-8 flex justify-center">/, path)
    assert.doesNotMatch(source, /text-h2|text-body text-muted/, path)
  }
  const unsubscribe = read('pages/unsubscribe-page.tsx')
  assert.match(unsubscribe, /<h1 className="text-h1">\{content\.title\}<\/h1>/)
  assert.match(unsubscribe, /<p className="mt-4 lead">\{content\.body\}<\/p>/)
  assert.match(unsubscribe, /<div className="mt-8 flex justify-center">/)

  assert.match(read('pages/not-found-page.tsx'), /<div className="mx-auto max-w-prose text-center">/)
})

test('legal pages set 14px body copy, ink headings and a borderless surfaceAlt closing card', () => {
  const legal = read('pages/legal-page.tsx')
  assert.match(legal, /className="mx-auto grid max-w-readable gap-10 text-body text-ink-soft \[&_h2\]:text-ink"/)
  assert.match(legal, /className="mx-auto grid max-w-readable gap-10 text-body"/)
  assert.match(legal, /This wireframe shows section structure only: plain-language paragraphs go here\./)
  assert.doesNotMatch(legal, /structure only —/)
  assert.equal((legal.match(/<Card variant="surfaceAlt" className="flex flex-wrap items-center justify-between gap-4">/g) ?? []).length, 2)
  assert.doesNotMatch(legal, /className="card /)
})

test('contact page: inset-divider details panel, borderless form card, 120px textarea, semibold reply hint', () => {
  const contact = read('pages/contact-page.tsx')
  assert.match(contact, /<div className="mt-8 rounded-md border border-line bg-surface px-5 py-2">/)
  assert.match(contact, /className="grid gap-4 rounded-md bg-surface p-5 sm:p-6"/)
  assert.doesNotMatch(contact, /className="card /)
  assert.match(contact, /className="field min-h-30 resize-y py-3"/)
  assert.match(contact, /<p className="text-label font-semibold text-muted">We usually reply within one business day\.<\/p>/)
})

test('help topics are 14px ink-soft links and group headings sit 8px above their list', () => {
  const help = read('pages/help-page.tsx')
  assert.match(help, /<ul className="flex flex-wrap gap-x-4 gap-y-2 text-body text-ink-soft lg:grid lg:gap-2">/)
  assert.match(help, /<h2 className="mb-2 text-h6">\{category\}<\/h2>/)
  // The orchestrator's closing CTA stays after the FAQ.
  assert.match(help, /<FinalCtaSection\s+id="help-cta"/)
})

test('auth copy and links follow Figma', () => {
  assert.match(read('pages/auth/sign-up-page.tsx'), /intro="Save your orders and download purchased files anytime from your account\."/)
  const login = read('pages/auth/login-page.tsx')
  // inline-flex min-h-6 keeps the WCAG 2.2 24px target on the small inline link.
  assert.match(login, /<p className="text-right text-body">\s*<TextLink to="\/forgot-password" className="inline-flex min-h-6 items-center">Forgot password\?<\/TextLink>/)
  assert.doesNotMatch(login, /-mt-1/)
  assert.match(read('pages/auth/auth-layout.tsx'), /<TextLink to="\/help" tone="soft">\s*Visit support\s*<\/TextLink>/)
})
