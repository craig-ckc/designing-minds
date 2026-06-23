import { describe, expect, it } from 'vitest'
import { amountMatches, formatPayfastAmount, fromCents, toCents } from './money.ts'

describe('toCents', () => {
  it('converts numbers and strings to integer cents', () => {
    expect(toCents(100)).toBe(10000)
    expect(toCents('100.00')).toBe(10000)
    expect(toCents(99.99)).toBe(9999)
    expect(toCents('0.05')).toBe(5)
  })

  it('rounds rather than truncating float noise', () => {
    expect(toCents(19.99)).toBe(1999)
    expect(toCents(0.1 + 0.2)).toBe(30)
  })
})

describe('fromCents / formatPayfastAmount', () => {
  it('round-trips cents back to rands', () => {
    expect(fromCents(10000)).toBe(100)
  })

  it('formats with exactly two decimals for PayFast', () => {
    expect(formatPayfastAmount(10000)).toBe('100.00')
    expect(formatPayfastAmount(9999)).toBe('99.99')
    expect(formatPayfastAmount(10005)).toBe('100.05')
  })
})

describe('amountMatches', () => {
  it('matches identical amounts across number and string forms', () => {
    expect(amountMatches('100.00', 100)).toBe(true)
  })

  it('tolerates a one-cent rounding difference', () => {
    expect(amountMatches('100.01', '100.00')).toBe(true)
  })

  it('rejects a difference larger than one cent', () => {
    expect(amountMatches('100.02', '100.00')).toBe(false)
    expect(amountMatches('0.01', '100.00')).toBe(false)
  })
})
