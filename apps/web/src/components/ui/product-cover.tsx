import { type Product } from '@designing-minds/cms'
import { subjectIllustration, termColorway, type SubjectIllustration } from '../../lib/cover-mappings'
import { Logo } from './logo'

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

/** One cover face — its own container context so everything scales to its width. */
function CoverFace({ product, illustration, className = '' }: { product: Product; illustration: SubjectIllustration; className?: string }) {
  const { band, fg, solid } = termColorway(product.term)
  return (
    <div className={`[container-type:inline-size] ${className}`}>
      <div className="relative aspect-[595/842] w-full overflow-hidden rounded-[1.8cqw] bg-paper [box-shadow:0_0.7cqw_2.2cqw_-0.7cqw_rgba(41,25,10,0.14),0_2.8cqw_6.4cqw_-2.2cqw_rgba(41,25,10,0.18)]">
        <div className={`absolute inset-x-0 bottom-0 ${band}`} aria-hidden >
          <svg width="100%" viewBox="0 0 595 513" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M414.742 7.04244C560.002 7.04244 595.002 101.411 595.002 101.411V513.012H0.000923993C0.000923993 513.012 -0.00298001 165.498 0.00526146 16.9019C52.1023 16.9019 90.839 34.508 90.839 34.508C90.839 34.508 135.895 0 186.602 0C242.924 0 283.773 40.1419 283.773 40.1419C283.773 40.1419 329.533 7.04244 414.742 7.04244Z" fill="currentColor" />
          </svg>
          <svg width="100%"  viewBox="0 0 595 339" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute left-0 bottom-0 ${fg}`}>
            <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M72.45 29.1453C98.3749 5.21716 133.963 -9.95472 166.843 7.63064L167.62 8.05154L169.046 8.83767L170.297 9.87966C194.571 30.1102 198.94 61.9973 190.235 94.3963C181.527 126.809 159.301 162.865 125.157 198.059C109.726 213.965 91.7118 229.85 71.1229 245.305C93.2622 271.917 132.545 294.779 198.158 304.451C261.439 309.72 326.175 283.148 402.313 252.545C460.539 229.141 524.269 204.011 595 193.983C595 198.568 595 216.568 595 228.337C531.055 238.096 472.153 261.117 414.994 284.092C341.14 313.777 267.955 344.578 194.74 338.285L194.237 338.241L193.738 338.169C120.742 327.504 72.0287 300.892 43.2313 264.908C29.7241 273.802 15.3136 282.482 0.000793411 290.864C0.00262992 276.568 -0.00169377 270.068 0.000793411 251.775C8.77071 246.617 17.178 241.369 25.2235 236.053C9.60739 202.816 8.15186 166.388 15.1893 133.024C23.8582 91.9257 45.6874 53.8467 72.45 29.1453ZM149.759 37.0818C135.941 30.4371 116.685 34.5854 95.5096 54.1297C74.2188 73.7808 55.7525 105.454 48.4568 140.042C43.0422 165.712 43.9368 192.072 53.5555 215.961C71.5753 202.227 87.3039 188.248 100.754 174.385C132.352 141.814 150.662 110.651 157.399 85.575C163.867 61.5017 159.273 45.915 149.759 37.0818Z" fill="currentColor" />
          </svg>
        </div>

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
          <div className={`w-[117.7%] h-[30.7%] rotate-45 text-center ${solid} flex items-center justify-center`}>
            <span className="w-full font-extrabold leading-[1.2] tracking-[0.034cqw] text-on-primary text-[4.36cqw]">
              {product.term}
            </span>
          </div>
        </div>
        <img
          src={`/${illustration}`}
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
    return (
      <div className="relative aspect-[595/842] w-full flex items-center justify-center">
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
    <div className={`w-full ${className}`}>
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
