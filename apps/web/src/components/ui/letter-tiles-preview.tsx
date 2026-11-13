/**
 * Live preview of a clicker letter keyring: one cream tile per letter set in a
 * coloured frame, letters in the frame colour, and a looped cord in a lighter
 * tint — drawn from the product photos, so a shopper sees their exact name.
 * Pure SVG: no image generation, crisp at any size, and cheap to re-render on
 * every keystroke.
 */

import { isHexColour, previewTiles, tint } from '../../lib/letter-tiles'

const TILE = 100
const GAP = 8
const PAD = 12
const TILE_FILL = '#fbf6ee'
const DEFAULT_COLOUR = '#3b82f6'

export function LetterTilesPreview({
  text,
  colour,
  colourName,
  placeholder = 'NAME',
  className = '',
}: {
  text: string
  colour?: string
  /** Shopper-facing colour name for the accessible description. */
  colourName?: string
  placeholder?: string
  className?: string
}) {
  const shown = text.trim() ? previewTiles(text) : previewTiles(placeholder)
  const isPlaceholder = !text.trim()
  const frame = isHexColour(colour) ? colour : DEFAULT_COLOUR
  const cord = tint(frame, 0.45)
  const count = Math.max(shown.length, 1)
  const frameWidth = count * TILE + (count - 1) * GAP + PAD * 2
  const frameHeight = TILE + PAD * 2
  const midY = frameHeight / 2
  // A short cord loop hangs from a ring on the left; keep its footprint small
  // so long names still get most of the width.
  const cordSpan = 92
  const viewBox = `${-cordSpan} -6 ${frameWidth + cordSpan + 6} ${frameHeight + 70}`
  const label = isPlaceholder
    ? 'Keyring preview. Type a name to see it on the tiles.'
    : `Keyring preview: ${shown.filter((letter) => letter.trim()).join(' ')}${colourName ? ` in ${colourName}` : ''}`

  return (
    <figure className={`grid gap-2 ${className}`}>
      <svg role="img" aria-label={label} viewBox={viewBox} className="h-24 w-full sm:h-28" preserveAspectRatio="xMidYMid meet">
        <path
          d={`M -16 ${midY} C -44 ${midY + 10}, -86 ${midY + 52}, -70 ${midY + 76} C -54 ${midY + 96}, -26 ${midY + 50}, -16 ${midY}`}
          fill="none" stroke={cord} strokeWidth={12} strokeLinecap="round"
        />
        <circle cx={-10} cy={midY} r={11} fill="none" stroke={frame} strokeWidth={6} />
        <rect x={0} y={0} width={frameWidth} height={frameHeight} rx={18} fill={frame} />
        {shown.map((letter, index) => {
          const x = PAD + index * (TILE + GAP)
          return (
            <g key={index}>
              <rect x={x} y={PAD} width={TILE} height={TILE} rx={14} fill={TILE_FILL} stroke="rgba(0,0,0,0.08)" strokeWidth={2} />
              {letter.trim() ? (
                <text
                  x={x + TILE / 2} y={PAD + TILE / 2} dy="0.35em" textAnchor="middle"
                  fontFamily="inherit" fontWeight={800} fontSize={60}
                  fill={frame} opacity={isPlaceholder ? 0.35 : 1}
                >{letter}</text>
              ) : null}
            </g>
          )
        })}
      </svg>
      {isPlaceholder ? <figcaption className="text-caption text-muted">Type a name to see your tiles.</figcaption> : null}
    </figure>
  )
}
