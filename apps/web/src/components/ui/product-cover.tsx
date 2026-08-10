import { subjectIllustration, termColorway, type SubjectIllustration } from '../../lib/cover-mappings'

/**
 * Catalogue "book cover" thumbnail, rebuilt from the Figma A4 frame (595×842).
 *
 * A single resource renders one cover. A bundle holds many, so it renders a
 * fanned STACK (subject glyphs vary to hint at what's inside). Each CoverFace
 * is its own container-query context, so type, radius and shadow scale
 * proportionally at any width — no JS, SSR-safe.
 *
 * Colour ← TERM. Illustration ← SUBJECT. Term is the corner ribbon. Seeded
 * subjects map to assets in `/subjects`.
 *
 * Typed on the shape it draws rather than on Product, because bundles are a
 * separate Collection with no subjects of their own — a bundle's caller passes
 * the subjects of its members.
 */
export interface CoverItem {
  title: string
  grade: string
  term: string
  subjects: string[]
}

function subjectKey(product: CoverItem): SubjectIllustration {
  return subjectIllustration(product.subjects[0] ?? product.title)
}

/** Up to 3 distinct subject glyphs to fan for a multi-file cover — prefers the
 *  item's own subjects, then fills from a sensible default set. */
function stackSubjects(product: CoverItem): SubjectIllustration[] {
  const distinct = [...new Set(product.subjects.map(subjectIllustration))]
  const defaults: SubjectIllustration[] = [
    'subjects/mathematics.avif',
    'subjects/english.avif',
    'subjects/science.avif',
  ]
  return [...distinct, ...defaults.filter((d) => !distinct.includes(d))].slice(0, 3)
}

/** Big cover title: the title with grade/term stripped (shown separately). */
function coverTitle(product: CoverItem): string {
  const t = product.title
    .replace(/^\s*grade\s+\w+\s*/i, '')
    .replace(/\bterm\s+\w+\b/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return t || product.subjects[0] || product.title
}

/** Readable subject name from an illustration path ("subjects/mathematics.avif" → "Mathematics"). */
function illustrationLabel(illustration: SubjectIllustration): string {
  const name = illustration.split('/').pop()?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') ?? ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** One cover face — its own container context so everything scales to its width. */
function CoverFace({
  product,
  illustration,
  className = '',
  priority = false,
}: {
  product: CoverItem
  illustration: SubjectIllustration
  className?: string
  priority?: boolean
}) {
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
        <span className={`product-cover-copy product-cover-brand absolute left-[13.78%] top-[4.16%] font-extrabold uppercase tracking-[0.08em] ${fg}`}>
          Designing Minds
        </span>
        <p className={`product-cover-copy product-cover-meta absolute left-[13.78%] top-[11.64%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.034cqw] ${fg}`}>
          {product.grade}
        </p>
        <div className={`absolute left-[13.78%] top-[16.87%] h-px w-[74.29%] opacity-30 ${solid}`} />
        <p className={`product-cover-copy product-cover-title absolute left-[13.78%] top-[19.36%] w-[74.29%] font-extrabold leading-[1.2] tracking-[0.069cqw] ${fg} line-clamp-3`}>
          {coverTitle(product)}
        </p>
        <div className="absolute left-[76.97%] top-[-5.23%] grid aspect-square w-[31.13%] place-items-center">
          <div className={`w-[117.7%] h-[30.7%] rotate-45 text-center ${solid} flex items-center justify-center`}>
            <span className="product-cover-copy product-cover-meta w-full font-extrabold leading-[1.2] tracking-[0.034cqw] text-on-primary">
              {product.term}
            </span>
          </div>
        </div>
        <img
          src={`/${illustration}`}
          alt={`${illustrationLabel(illustration)} illustration`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="absolute left-1/2 top-[46.2%] aspect-square w-[71.43%] -translate-x-1/2 object-contain"
        />
      </div>
    </div>
  )
}

export function ProductCover({
  product,
  stacked = false,
  className = '',
  priority = false,
}: {
  product: CoverItem
  /** Draw a fanned deck instead of one cover — bundles contain many resources. */
  stacked?: boolean
  className?: string
  priority?: boolean
}) {
  if (!stacked) {
    return (
      <div role="img" aria-label={product.title} className="relative aspect-[595/842] w-full flex items-center justify-center">
        <div className="w-[80%]">
          <CoverFace product={product} illustration={subjectKey(product)} className={`w-full ${className}`} priority={priority} />
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
              <CoverFace
                product={product}
                illustration={layer.illustration}
                className="w-full"
                priority={priority && i === layers.length - 1}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
