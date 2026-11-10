// Colour names are stored as option values, not CSS. Unknown finishes keep a
// labelled choice rather than displaying an invented colour.
const COLOUR_SWATCHES: Record<string, string> = {
  pink: '#f3a0c2', blue: '#7faee3', green: '#8abd99', purple: '#b299d4',
  red: '#d94a4a', orange: '#efa35c', yellow: '#f3d46b', white: '#ffffff',
  black: '#262626', grey: '#a3a3a3', gray: '#a3a3a3', brown: '#946b4d',
  mint: '#b8dfce', lilac: '#c8b4e5', navy: '#253b61', turquoise: '#64c5c1',
}

export function optionColour(value: string): string | undefined {
  const name = value.trim().toLowerCase()
  if (/^#[\da-f]{6}$/i.test(name)) return name
  return Object.hasOwn(COLOUR_SWATCHES, name) ? COLOUR_SWATCHES[name] : undefined
}
