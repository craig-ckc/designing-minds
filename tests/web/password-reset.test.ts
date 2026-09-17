import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CANONICAL_SITE_URL, resolvePasswordResetRedirectUrl } from '../../apps/web/src/site-url.ts'

const authSource = readFileSync(new URL('../../apps/web/src/lib/auth.tsx', import.meta.url), 'utf8')
const resetSource = readFileSync(
  new URL('../../apps/web/src/pages/auth/reset-password-page.tsx', import.meta.url),
  'utf8',
)
const forgotSource = readFileSync(
  new URL('../../apps/web/src/pages/auth/forgot-password-page.tsx', import.meta.url),
  'utf8',
)

test('password-reset redirect stays on the canonical origin in production', () => {
  assert.equal(
    resolvePasswordResetRedirectUrl('https://www.designingminds.co.za'),
    `${CANONICAL_SITE_URL}/reset-password`,
  )
  assert.equal(resolvePasswordResetRedirectUrl(undefined), `${CANONICAL_SITE_URL}/reset-password`)
})

test('password-reset redirect falls back to canonical for preview or bad origins', () => {
  for (const origin of ['https://designingminds.vercel.app', 'https://designingminds.co.za', 'not a URL', '']) {
    assert.equal(resolvePasswordResetRedirectUrl(origin), `${CANONICAL_SITE_URL}/reset-password`, origin || '<empty>')
  }
})

test('password-reset redirect retains local development origins', () => {
  for (const origin of ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']) {
    assert.equal(resolvePasswordResetRedirectUrl(origin), `${origin}/reset-password`, origin)
  }
})

test('password-reset redirect falls back when a local origin is not allowlisted', () => {
  for (const origin of ['http://localhost:5174', 'https://localhost:5173', 'http://[::1]:5173']) {
    assert.equal(resolvePasswordResetRedirectUrl(origin), `${CANONICAL_SITE_URL}/reset-password`, origin)
  }
})

test('web auth sends the reset email with the testable redirect helper', () => {
  assert.match(authSource, /resolvePasswordResetRedirectUrl/)
  assert.match(authSource, /resetPasswordForEmail/)
  assert.doesNotMatch(authSource, /redirectTo:\s*`?\$\{window\.location\.origin\}\/reset-password`?/)
})

test('recovery page waits for auth init before offering the form', () => {
  assert.match(resetSource, /loading/)
  assert.match(resetSource, /Checking your reset link/)
})

test('recovery page shows an expired/invalid-link state without a misleading form', () => {
  assert.match(resetSource, /session/)
  assert.match(resetSource, /expired|invalid/i)
  assert.match(resetSource, /Request a new link|Request another/)
})

test('recovery page keeps password mismatch and minimum-length validation', () => {
  assert.match(resetSource, /Passwords do not match/)
  assert.match(resetSource, /at least 8 characters/i)
})

test('forgot-password keeps privacy-safe reset-email messaging', () => {
  assert.match(forgotSource, /If an account exists for/)
})
