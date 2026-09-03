import { describe, expect, it } from 'vitest'
import { checkout } from '../../apps/functions/src/handlers/checkout.ts'

const request = (body: unknown) => ({ method: 'POST', body, headers: {} })
const items = [{ productSlug: 'grade-4-mathematics-test' }]

describe('checkout Terms of Use agreement', () => {
  it.each([
    ['missing', { items }],
    ['false', { items, acceptedTerms: false }],
    ['truthy but not boolean true', { items, acceptedTerms: 'true' }],
  ])('rejects %s agreement', async (_case, body) => {
    await expect(checkout(request(body))).resolves.toEqual({
      status: 400,
      body: { error: 'You must agree to the Terms of Use before checkout.' },
    })
  })

  it('continues to authentication only when agreement is exactly true', async () => {
    await expect(checkout(request({ items, acceptedTerms: true }))).resolves.toEqual({
      status: 401,
      body: { error: 'Missing bearer token.' },
    })
  })
})
