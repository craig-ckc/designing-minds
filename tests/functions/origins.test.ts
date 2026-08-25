import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiOrigin, siteUrl } from '../../apps/functions/src/lib/origins.ts'

describe('origins', () => {
  const original = { site: process.env.SITE_URL, api: process.env.API_PUBLIC_ORIGIN }

  beforeEach(() => {
    process.env.SITE_URL = 'https://designingminds.co.za/'
    delete process.env.API_PUBLIC_ORIGIN
  })
  afterEach(() => {
    for (const [key, value] of [
      ['SITE_URL', original.site],
      ['API_PUBLIC_ORIGIN', original.api],
    ] as const) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('normalises the storefront origin', () => {
    expect(siteUrl()).toBe('https://designingminds.co.za')
    process.env.SITE_URL = 'designingminds.co.za'
    expect(siteUrl()).toBe('https://designingminds.co.za')
  })

  it('throws without a storefront origin', () => {
    delete process.env.SITE_URL
    expect(() => siteUrl()).toThrow(/SITE_URL/)
  })

  it('sends the ITN to the storefront origin when no API origin is configured', () => {
    expect(apiOrigin()).toBe('https://designingminds.co.za')
  })

  it('sends the ITN straight to the functions origin when configured', () => {
    process.env.API_PUBLIC_ORIGIN = 'https://api.designingminds.co.za/'
    expect(apiOrigin()).toBe('https://api.designingminds.co.za')
    process.env.API_PUBLIC_ORIGIN = 'api.designingminds.co.za'
    expect(apiOrigin()).toBe('https://api.designingminds.co.za')
  })
})
