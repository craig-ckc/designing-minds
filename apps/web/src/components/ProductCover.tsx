import { type Product } from '@designing-minds/cms'
import { Icon, type IconName } from './ui/Icon'

/** Pastel colour-ways (pastel band + deep foreground) drawn from the brand palette. */
const COLORWAYS = [
  { band: 'bg-butter', fg: 'text-amber', ribbon: 'bg-amber' },
  { band: 'bg-blossom', fg: 'text-magenta', ribbon: 'bg-magenta' },
  { band: 'bg-meadow', fg: 'text-forest', ribbon: 'bg-forest' },
  { band: 'bg-periwinkle', fg: 'text-navy', ribbon: 'bg-navy' },
  { band: 'bg-lagoon', fg: 'text-teal', ribbon: 'bg-teal' },
] as const

function hashStr(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

const prettify = (slug: string) => slug.replace(/-/g, ' ').trim()

/** Pick a glyph that suits the subject, falling back to a neutral one. */
function glyphFor(subject: string, isBundle: boolean): IconName {
  if (isBundle) return 'book'
  const s = subject.toLowerCase()
  if (/(math|number|numerac)/.test(s)) return 'calc'
  if (/(english|language|read|literac|afrikaans|home\s?language|fal|hl)/.test(s)) return 'book'
  if (/(science|nst|natural|biolog|chem|physic)/.test(s)) return 'flask'
  if (/(history|geograph|social|world|life\s?skill)/.test(s)) return 'globe'
  if (/(art|creativ|music|design)/.test(s)) return 'palette'
  return 'pencil'
}

/** Tiny Designing Minds smile mark for the cover header. */
function SmileMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3.5" width="18" height="17" rx="5" fill="currentColor" />
      <path d="M8 12c.9 2.3 2.6 3.6 4 3.6S15.1 14.3 16 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** The signature "worksheet cover" thumbnail: pastel band + subject glyph + term ribbon. */
export function ProductCover({ product, className = '' }: { product: Product; className?: string }) {
  const isBundle = product.productKind !== 'Single'
  const subject = product.subjects[0] ?? ''
  // Singles are colour-coded by subject; bundles/plans vary by slug for a lively grid.
  const cw = COLORWAYS[hashStr(isBundle ? product.slug : subject || product.grade) % COLORWAYS.length]
  const glyph = glyphFor(subject, isBundle)
  const coverTitle = isBundle ? product.productKind : subject ? prettify(subject) : 'Resource'

  return (
    <div className={`relative flex aspect-[3/4] flex-col overflow-hidden rounded-lg bg-surface shadow-soft ${className}`}>
      {/* left page-spine hint */}
      <span className="absolute inset-y-2 left-1.5 z-10 w-1 rounded-full bg-black/[0.06]" aria-hidden />

      {/* pastel header band */}
      <div className={`${cw.band} px-4 pb-5 pt-4`}>
        <div className={`flex items-center gap-1.5 ${cw.fg}`}>
          <SmileMark className="h-4 w-4" />
          <span className="text-[0.6rem] font-extrabold tracking-[-0.01em]">Designing Mind</span>
        </div>
        <p className={`mt-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] ${cw.fg} opacity-70`}>{product.grade}</p>
        <p className={`mt-1 text-[0.98rem] font-extrabold uppercase leading-[1.15] tracking-[-0.01em] ${cw.fg} line-clamp-2`}>
          {coverTitle}
        </p>
      </div>

      {/* subject glyph */}
      <div className="grid flex-1 place-items-center py-5">
        <span className={`h-20 w-20 ${cw.fg}`}>
          <Icon name={glyph} />
        </span>
      </div>

      {/* diagonal term ribbon */}
      <div
        className={`absolute -right-10 top-3.5 w-32 rotate-45 ${cw.ribbon} py-1 text-center text-[0.6rem] font-extrabold uppercase tracking-[0.06em] text-white shadow-soft`}
      >
        {product.term}
      </div>
    </div>
  )
}
