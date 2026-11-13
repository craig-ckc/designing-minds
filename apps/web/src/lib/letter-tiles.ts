const HEX = /^#[0-9a-fA-F]{6}$/

export const isHexColour = (value: string | undefined): value is string => typeof value === 'string' && HEX.test(value)

/** Mix a #rrggbb colour with white; `amount` 0 = unchanged, 1 = white. */
export function tint(hex: string, amount: number): string {
  if (!HEX.test(hex)) return hex
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16)
    return Math.round(value + (255 - value) * amount).toString(16).padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

/** The tiles to draw: letters in order, spaces kept as gaps, capped for legibility. */
export function previewTiles(text: string, maxTiles = 14): string[] {
  return Array.from(text.toUpperCase()).slice(0, maxTiles)
}
