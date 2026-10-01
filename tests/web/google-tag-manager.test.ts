import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('public web shell loads Google Tag Manager at the start of head and body', () => {
  const html = readFileSync(new URL('../../apps/web/index.html', import.meta.url), 'utf8')
  const head = html.slice(html.indexOf('<head>') + '<head>'.length, html.indexOf('</head>'))
  const body = html.slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'))

  assert.match(head, /^\s*<!-- Google Tag Manager -->/)
  assert.match(head, /googletagmanager\.com\/gtm\.js\?id=/)
  assert.match(head, /GTM-TD6GWNXM/)
  assert.match(body, /^\s*<!-- Google Tag Manager \(noscript\) -->/)
  assert.match(body, /googletagmanager\.com\/ns\.html\?id=GTM-TD6GWNXM/)
})

test('public web shell leaves GA4 installation to Google Tag Manager', () => {
  const html = readFileSync(new URL('../../apps/web/index.html', import.meta.url), 'utf8')

  assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js/)
  assert.doesNotMatch(html, /gtag\(/)
})

test('client-side routing does not duplicate GTM page views', () => {
  const source = readFileSync(new URL('../../apps/web/src/lib/use-route-head.ts', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /gtag|['"]page_view['"]/)
})
