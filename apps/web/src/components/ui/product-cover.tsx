import { type Product } from '@designing-minds/cms'
import { Logo } from './logo'

/**
 * Subject "book cover" thumbnail, rebuilt from the Figma A4 frame (595×842).
 *
 * Scalable: the root is a container-query context sized purely by its parent's
 * width (`aspect-[595/842]` locks the height). Positions/sizes are percentages
 * of the frame and type is in `cqw`, so the whole cover scales proportionally at
 * any width — no JS, SSR-safe. Every element is absolutely positioned, so the
 * fixed top band never reflows when the title runs long.
 *
 * Three colours per cover: a soft band (`band`), a deep ink (`fg`, also the
 * ribbon/spine/divider), and white. Subject illustrations are swappable images —
 * drop a replacement at `/covers/<theme>.svg` to change one.
 */

type Theme = { band: string; fg: string; solid: string }

// theme key → colour-way. Keys double as the illustration filename in /public.
const THEMES = {
  maths: { band: 'bg-butter', fg: 'text-amber', solid: 'bg-amber' },
  english: { band: 'bg-periwinkle', fg: 'text-navy', solid: 'bg-navy' },
  science: { band: 'bg-meadow', fg: 'text-forest', solid: 'bg-forest' },
  humanities: { band: 'bg-lagoon', fg: 'text-teal', solid: 'bg-teal' },
  arts: { band: 'bg-blossom', fg: 'text-magenta', solid: 'bg-magenta' },
  general: { band: 'bg-periwinkle', fg: 'text-navy', solid: 'bg-navy' },
  bundle: { band: 'bg-periwinkle', fg: 'text-navy', solid: 'bg-navy' },
} satisfies Record<string, Theme>

type ThemeKey = keyof typeof THEMES

/**
 * Map a product to its theme (colour-way + illustration).
 * Matches title + all subject tags (products can carry several subjects, and
 * `subjects[0]` isn't always the primary one — the title is the reliable signal).
 * Order matters: humanities before science ("Social Sciences" contains "science").
 */
function themeFor(product: Product): ThemeKey {
  if (product.productKind !== 'Single') return 'bundle'
  const s = `${product.title} ${product.subjects.join(' ')}`.toLowerCase()
  if (/(math|number|numerac)/.test(s)) return 'maths'
  if (/(english|language|read|literac|afrikaans|\bfal\b|\bhl\b)/.test(s)) return 'english'
  if (/(history|geograph|social|world|life\s?skill)/.test(s)) return 'humanities'
  if (/(science|nst|natural|biolog|chem|physic)/.test(s)) return 'science'
  if (/(\barts?\b|creativ|music|visual)/.test(s)) return 'arts'
  return 'general'
}

/** Big cover title: the product title with grade/term stripped (shown separately). */
function coverTitle(product: Product): string {
  const t = product.title
    .replace(/^\s*grade\s+\w+\s*/i, '')
    .replace(/\bterm\s+\w+\b/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return t || product.subjects[0] || product.productKind
}

export function ProductCover({ product, className = '' }: { product: Product; className?: string }) {
  const key = themeFor(product)
  const { band, fg, solid } = THEMES[key]

  return (
    <div className={`relative aspect-[595/842] w-full overflow-hidden rounded-[0.24cqw] bg-paper shadow-soft [container-type:inline-size] ${className}`} >
      {/* top band — fixed height, absolutely positioned so text never reflows it */}
      <div className={`absolute inset-x-0 top-0 h-[42.87%] ${band}`} aria-hidden />

      {/* left page-spine hint (full height) */}
      <div className={`absolute left-[7.56%] top-0 h-full w-[0.34cqw] opacity-30 ${solid}`} aria-hidden />

      {/* brand Wordmark */}
      <div className="absolute left-[13.78%] top-[4.16%] w-[16.13%]">
        <Logo className={`block w-full ${fg}`} />
      </div>

      {/* grade */}
      <p className={`absolute left-[13.78%] top-[11.64%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.034cqw] opacity-80 ${fg} text-[4.36cqw]`} >
        {product.grade}
      </p>

      {/* divider */}
      <div className={`absolute left-[13.78%] top-[16.87%] h-px w-[74.29%] opacity-30 ${solid}`} aria-hidden />

      {/* title */}
      <p className={`absolute left-[13.78%] top-[19.36%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.069cqw] ${fg} text-[6.89cqw] line-clamp-3`} >
        {coverTitle(product)}
      </p>

      {/* diagonal term ribbon (top-right corner) */}
      <div className="absolute left-[76.97%] top-[-5.23%] grid aspect-square w-[31.13%] place-items-center">
        <div className={`w-[117.7%] rotate-45 text-center ${solid}`}>
          <span className="w-full font-extrabold leading-[1.2] tracking-[0.034cqw] text-on-primary text-[4.36cqw]">
            {product.term}
          </span>
        </div>
      </div>

      {/* swappable subject illustration — centred in the lower half */}
      <img src={`/covers/${key}.svg`} alt="" aria-hidden loading="lazy" decoding="async" className="absolute left-1/2 top-[46.2%] aspect-square w-[71.43%] -translate-x-1/2 object-contain"/>
    </div>
  )
}
