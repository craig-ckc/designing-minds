import { type Product } from '@designing-minds/cms'
import { subjectIllustration, termColorway, type SubjectIllustration } from '../../lib/cover-mappings'

/**
 * Product "book cover" thumbnail, rebuilt from the Figma A4 frame (595×842).
 *
 * A Single renders one cover. A Bundle / Access Plan holds many files, so it
 * renders a fanned STACK of covers (subject glyphs vary to hint at what's
 * inside). Each CoverFace is its own container-query context, so type, radius
 * and shadow scale proportionally at any width — no JS, SSR-safe.
 *
 * Colour ← TERM. Illustration ← SUBJECT. Term is
 * the corner ribbon. Seeded subjects map to assets in `/subjects`.
 */

function subjectKey(product: Product): SubjectIllustration {
  return subjectIllustration(product.subjects[0] ?? product.title)
}

/** Up to 3 distinct subject glyphs to fan for a multi-file cover — prefers the
 *  product's own subjects, then fills from a sensible default set. */
function stackSubjects(product: Product): SubjectIllustration[] {
  const distinct = [...new Set(product.subjects.map(subjectIllustration))]
  const defaults: SubjectIllustration[] = [
    'subjects/mathematics.avif',
    'subjects/english.avif',
    'subjects/science.avif',
  ]
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

/** Readable subject name from an illustration path ("subjects/mathematics.avif" → "Mathematics"). */
function illustrationLabel(illustration: SubjectIllustration): string {
  const name = illustration.split('/').pop()?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') ?? ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** One cover face — its own container context so everything scales to its width. */
function CoverFace({ product, illustration, className = '' }: { product: Product; illustration: SubjectIllustration; className?: string }) {
  const { band, fg, solid } = termColorway(product.term)
  // The whole face is decorative: its text and glyphs are announced once, via the
  // aria-label on the ProductCover wrapper. Hiding it here keeps that label from
  // being fragmented into loose strings by a screen reader.
  return (
    <div aria-hidden className={`[container-type:inline-size] ${className}`}>
      <div className="relative aspect-[595/842] w-full overflow-hidden rounded-[1.8cqw] bg-paper [box-shadow:0_0.7cqw_2.2cqw_-0.7cqw_rgba(41,25,10,0.14),0_2.8cqw_6.4cqw_-2.2cqw_rgba(41,25,10,0.18)]">
        <div className={`absolute inset-x-0 bottom-0 ${band}`}>
          <svg width="100%" viewBox="0 0 595 513" fill="none" xmlns="http://www.w3.org/2000/svg">
            <use href="/icons.svg#cover-band-shape" />
          </svg>
          <svg width="100%"  viewBox="0 0 595 339" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute left-0 bottom-0 ${fg}`}>
            <use href="/icons.svg#cover-band-accent" />
          </svg>
        </div>

        <div className={`absolute left-[7.56%] top-0 h-full w-[0.34cqw] opacity-30 ${solid}`} />
        <span className={`absolute left-[13.78%] top-[4.16%] text-[2.5cqw] font-extrabold uppercase tracking-[0.08em] ${fg}`}>
          Designing Minds
        </span>
        <p className={`absolute left-[13.78%] top-[11.64%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.034cqw] opacity-80 ${fg} text-[4.36cqw]`}>
          {product.grade}
        </p>
        <div className={`absolute left-[13.78%] top-[16.87%] h-px w-[74.29%] opacity-30 ${solid}`} />
        <p className={`absolute left-[13.78%] top-[19.36%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.069cqw] ${fg} text-[6.89cqw] line-clamp-3`}>
          {coverTitle(product)}
        </p>
        <div className="absolute left-[76.97%] top-[-5.23%] grid aspect-square w-[31.13%] place-items-center">
          <div className={`w-[117.7%] h-[30.7%] rotate-45 text-center ${solid} flex items-center justify-center`}>
            <span className="w-full font-extrabold leading-[1.2] tracking-[0.034cqw] text-on-primary text-[4.36cqw]">
              {product.term}
            </span>
          </div>
        </div>
        <img
          src={`/${illustration}`}
          alt={`${illustrationLabel(illustration)} illustration`}
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
    return (
      <div role="img" aria-label={product.title} className="relative aspect-[595/842] w-full flex items-center justify-center">
        <div className="w-[80%]">
          <CoverFace product={product} illustration={subjectKey(product)} className={`w-full ${className}`} />
        </div>
      </div>
    )
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
    <div role="img" aria-label={product.title} className={`w-full ${className}`}>
      <div className="relative aspect-[595/842]">
        {layers.map((layer, i) => (
          <div key={i} className="absolute inset-0 flex items-center justify-center">
            <div className="w-[80%]" style={{ transform: `rotate(${layer.deg}deg)` }}>
              <CoverFace product={product} illustration={layer.illustration} className="w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
