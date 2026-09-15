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

test('public web shell loads the configured GA4 tag without automatic duplicate page views', () => {
  const html = readFileSync(new URL('../../apps/web/index.html', import.meta.url), 'utf8')

  assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-GP667TCKJD/)
  assert.match(html, /gtag\('config', 'G-GP667TCKJD', \{ send_page_view: false \}\)/)
})

test('client-side route changes send GA4 page views', () => {
  const source = readFileSync(new URL('../../apps/web/src/lib/use-route-head.ts', import.meta.url), 'utf8')

  assert.match(source, /gtag\?\.\('event', 'page_view'/)
  assert.match(source, /page_path: pathname/)
  assert.match(source, /page_location: window\.location\.href/)
})
