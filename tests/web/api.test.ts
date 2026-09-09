import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { transform } from 'esbuild'

const source = readFileSync(new URL('../../apps/web/src/lib/api.ts', import.meta.url), 'utf8')
const { code } = await transform(source, {
  loader: 'ts', format: 'esm',
  define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.designingminds.co.za"' },
})
const { apiUrl } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('storefront API calls use its same-origin proxy, including checkout', () => {
  assert.equal(apiUrl('/api/checkout'), '/api/checkout')
  assert.equal(apiUrl('api/forms'), '/api/forms')
  assert.equal(new URL(apiUrl('/api/checkout'), 'https://www.designingminds.co.za').origin, 'https://www.designingminds.co.za')
})
