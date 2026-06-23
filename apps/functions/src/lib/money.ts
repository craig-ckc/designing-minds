export const toCents = (amount: number | string): number => Math.round(Number(amount) * 100)

export const fromCents = (cents: number): number => cents / 100

export const formatPayfastAmount = (cents: number): string => fromCents(cents).toFixed(2)

export const amountMatches = (left: number | string, right: number | string): boolean =>
  Math.abs(toCents(left) - toCents(right)) <= 1

