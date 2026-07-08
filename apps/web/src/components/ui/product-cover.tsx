import { type Product } from '@designing-minds/cms'
import { gradeColorway } from '../../lib/grade-colors'
import { Logo } from './logo'

/**
 * Product "book cover" thumbnail, rebuilt from the Figma A4 frame (595×842).
 *
 * A Single renders one cover. A Bundle / Access Plan holds many files, so it
 * renders a fanned STACK of covers (subject glyphs vary to hint at what's
 * inside). Each CoverFace is its own container-query context, so type, radius
 * and shadow scale proportionally at any width — no JS, SSR-safe.
 *
 * Colour ← GRADE (no two grades look alike). Illustration ← SUBJECT. Term is
 * the corner ribbon. Illustrations are swappable at `/covers/<key>.svg`.
 */

type SubjectKey = 'maths' | 'english' | 'science' | 'humanities' | 'arts' | 'general' | 'bundle'

/** Classify a free-text subject/title into an illustration key. */
function classifySubject(text: string): SubjectKey {
  const s = text.toLowerCase()
  if (/(math|number|numerac)/.test(s)) return 'maths'
  if (/(english|language|read|literac|afrikaans|\bfal\b|\bhl\b)/.test(s)) return 'english'
  if (/(history|geograph|social|world|life\s?skill)/.test(s)) return 'humanities'
  if (/(science|nst|natural|biolog|chem|physic)/.test(s)) return 'science'
  if (/(\barts?\b|creativ|music|visual)/.test(s)) return 'arts'
  return 'general'
}

function subjectKey(product: Product): SubjectKey {
  if (product.productKind !== 'Single') return 'bundle'
  return classifySubject(`${product.title} ${product.subjects.join(' ')}`)
}

/** Up to 3 distinct subject glyphs to fan for a multi-file cover — prefers the
 *  product's own subjects, then fills from a sensible default set. */
function stackSubjects(product: Product): SubjectKey[] {
  const distinct = [...new Set(product.subjects.map(classifySubject))]
  const defaults: SubjectKey[] = ['maths', 'english', 'science', 'humanities', 'arts']
  return [...distinct, ...defaults.filter((d) => !distinct.includes(d))].slice(0, 3)
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

/** One cover face — its own container context so everything scales to its width. */
function CoverFace({ product, illustration, className = '' }: { product: Product; illustration: SubjectKey; className?: string }) {
  const { band, fg, solid } = gradeColorway(product.grade)
  return (
    <div className={`[container-type:inline-size] ${className}`}>
      <div className="relative aspect-[595/842] w-full overflow-hidden rounded-[1.8cqw] bg-paper [box-shadow:0_0.7cqw_2.2cqw_-0.7cqw_rgba(41,25,10,0.14),0_2.8cqw_6.4cqw_-2.2cqw_rgba(41,25,10,0.18)]">
        <div className={`absolute inset-x-0 top-0 h-[42.87%] ${band}`} aria-hidden />
        <div className={`absolute left-[7.56%] top-0 h-full w-[0.34cqw] opacity-30 ${solid}`} aria-hidden />
        <div className="absolute left-[13.78%] top-[4.16%] w-[16.13%]">
          <Logo className={`block w-full ${fg}`} />
        </div>
        <p className={`absolute left-[13.78%] top-[11.64%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.034cqw] opacity-80 ${fg} text-[4.36cqw]`}>
          {product.grade}
        </p>
        <div className={`absolute left-[13.78%] top-[16.87%] h-px w-[74.29%] opacity-30 ${solid}`} aria-hidden />
        <p className={`absolute left-[13.78%] top-[19.36%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.069cqw] ${fg} text-[6.89cqw] line-clamp-3`}>
          {coverTitle(product)}
        </p>
        <div className="absolute left-[76.97%] top-[-5.23%] grid aspect-square w-[31.13%] place-items-center">
          <div className={`w-[117.7%] rotate-45 text-center ${solid}`}>
            <span className="w-full font-extrabold leading-[1.2] tracking-[0.034cqw] text-on-primary text-[4.36cqw]">
              {product.term}
            </span>
          </div>
        </div>
        <img
          src={`/covers/${illustration}.svg`}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute left-1/2 top-[46.2%] aspect-square w-[71.43%] -translate-x-1/2 object-contain"
        />
      </div>
    </div>
  )
}

export function ProductCover({ product, className = '' }: { product: Product; className?: string }) {
  const isStacked = product.productKind === 'Bundle' || product.productKind === 'Access Plan'

  if (!isStacked) {
    return <CoverFace product={product} illustration={subjectKey(product)} className={`w-full ${className}`} />
  }

  const subs = stackSubjects(product)
  // A three-cover deck: every cover is the same size, centred in the box, and
  // simply rotated about its own centre by an even step (no translation). The
  // front sits straight on top; each CoverFace keeps its own shadow for depth.
  const layers = [
    { illustration: subs[2] ?? subs[0], deg: -12 },
    { illustration: subs[1] ?? subs[0], deg: -6 },
    { illustration: subs[0], deg: 0 },
  ]

  return (
    <div className={`w-full ${className}`}>
      <div className="relative aspect-[595/842]">
        {layers.map((layer, i) => (
          <div key={i} className="absolute inset-0 flex items-center justify-center">
            <div className="w-[74%]" style={{ transform: `rotate(${layer.deg}deg)` }}>
              <CoverFace product={product} illustration={layer.illustration} className="w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
