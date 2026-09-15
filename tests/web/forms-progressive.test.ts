import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('the newsletter form posts to the API natively and shows CSS-only fallback confirmations', () => {
  const source = read('components/ui/newsletter-form.tsx')

  // Native <form method="post"> to the same endpoint the JS client already
  // calls, so a submission still works before hydration or with JS disabled.
  assert.match(source, /<form[\s\S]*action=\{apiUrl\('\/api\/forms'\)\}/)
  assert.match(source, /<form[\s\S]*method="post"/)
  assert.match(source, /onSubmit=\{handleSubmit\}/)

  // Hidden fields the native POST needs that the JS client already sends inline.
  assert.match(source, /<input type="hidden" name="form" value="newsletter" \/>/)
  assert.match(source, /<input type="hidden" name="source" value=\{source\} \/>/)
  assert.match(source, /<input type="hidden" name="_return" value=\{pathname\} \/>/)
  assert.match(source, /name="website"/)
  assert.match(source, /name="email"/)

  // The redirect target comes from react-router, not window.location.
  assert.match(source, /import \{ useLocation \} from 'react-router-dom'/)
  assert.match(source, /const \{ pathname \} = useLocation\(\)/)

  // CSS-only confirmations: revealed by the :target pseudo-class when the
  // browser lands on the matching fragment after a native POST redirect.
  assert.match(source, /<p id="newsletter-sent" className="hidden target:block[^"]*">/)
  assert.match(source, /<p id="newsletter-failed" className="hidden target:block[^"]*">/)
})

test('the contact form posts to the API natively and shows CSS-only fallback confirmations', () => {
  const source = read('pages/contact-page.tsx')

  assert.match(source, /<form[\s\S]{0,80}action=\{apiUrl\('\/api\/forms'\)\}/)
  assert.match(source, /<form[\s\S]{0,80}method="post"/)
  assert.match(source, /onSubmit=\{handleSubmit\}/)

  // Hidden fields for the native POST.
  assert.match(source, /<input type="hidden" name="form" value="contact" \/>/)
  assert.match(source, /<input type="hidden" name="_return" value="\/contact" \/>/)
  assert.match(source, /name="website"/)

  // Every visible field carries a native `name` so a plain POST includes it.
  assert.match(source, /name="firstName"/)
  assert.match(source, /name="lastName"/)
  assert.match(source, /name="email"/)
  assert.match(source, /name="message"/)
  assert.match(source, /type="checkbox"\s*\n\s*name="marketing"/)

  // The topic <Select> is given a native form field name.
  assert.match(source, /<Select label="What can we help with\?" name="topic"/)

  // CSS-only confirmations, placed inside the form card.
  assert.match(source, /<p id="contact-sent" className="hidden target:block[^"]*">/)
  assert.match(source, /<p id="contact-failed" className="hidden target:block[^"]*">/)
})

test('Select accepts an optional native form `name` and forwards it to Base UI', () => {
  const source = read('components/ui/select.tsx')

  assert.match(source, /name\?:\s*string/)
  assert.match(source, /<BaseSelect\.Root[\s\S]*name=\{name\}/)
})
