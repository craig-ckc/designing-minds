// Illustrative "confidence over time" curve for the how-it-works section.
// `active` (0..2) marks which phase the reader is on; the dot glides along the
// curve to that point. Fill gradient is top-down; a light grid sits behind.

// Three points that lie on the curve below, one per phase (start / mid / end).
const DOTS = [
  { x: 20, y: 315 },
  { x: 489, y: 244 },
  { x: 980, y: 45 },
]
const CAPTIONS = ['Day one. Already running.', 'One week in. Fully set up.', 'Term-end. Exam-ready.']

const CURVE = 'M20,315 C350,300 620,230 980,45'

export function GrowthChart({ active = 0 }: { active?: number }) {
  const i = Math.min(Math.max(active, 0), DOTS.length - 1)
  const dot = DOTS[i]
  // Dot position as a % of the chart box (viewBox is 1000×360, SVG fills the box).
  const px = dot.x / 10
  const py = dot.y / 3.6
  const below = py < 50 // high dots get the pill beneath them so it never clips
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface">
      <svg viewBox="0 0 1000 360" className="block h-auto w-full text-primary" aria-hidden>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <pattern id="growthGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="var(--color-line)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="1000" height="360" fill="url(#growthGrid)" />
        <path d={`${CURVE} L980,360 L20,360 Z`} fill="url(#growthFill)" />
        <path d={CURVE} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        <g
          style={{
            transform: `translate(${dot.x}px, ${dot.y}px)`,
            transition: `transform 600ms ${ease}`,
          }}
        >
          <circle r="18" fill="currentColor" opacity="0.15" />
          <circle r="7.5" fill="currentColor" stroke="var(--color-surface)" strokeWidth="3.5" />
        </g>
      </svg>

      {/* Caption pill rides along with the dot so progress is easy to follow. */}
      <span
        className="pointer-events-none absolute z-10 whitespace-nowrap rounded-pill bg-primary px-3 py-1 text-caption font-bold text-on-primary"
        style={{
          left: `clamp(90px, ${px}%, calc(100% - 90px))`,
          top: `${py}%`,
          transform: below ? 'translate(-50%, 16px)' : 'translate(-50%, calc(-100% - 16px))',
          transition: `left 600ms ${ease}, top 600ms ${ease}`,
        }}
      >
        {CAPTIONS[i]}
      </span>
    </div>
  )
}
