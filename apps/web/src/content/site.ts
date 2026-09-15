/* Brand-level static content. Catalogue data (products, subjects, FAQs,
   testimonials) now comes from the CMS snapshot — not this file. */

import contact from './contact.json'
import gradeBlurbs from './grade-blurbs.json'

export const CONTACT = contact

export const GRADE_BLURB: Record<string, string> = gradeBlurbs

/** Grade label <-> URL slug helpers, e.g. "Grade 4" <-> "grade-4". */
export const gradeToSlug = (grade: string) => grade.toLowerCase().replace(/\s+/g, '-')
export const slugToGrade = (slug: string) =>
  slug.replace(/grade-(\d+)/i, (_match, n) => `Grade ${n}`)

/* Curated brand figures (Amy's catalogue feedback), not derived from the live
   catalogue — the public snapshot never carries customer counts.

   One customer count, used everywhere. The hero claim and the stats band once
   carried different numbers (500+ and 750+) and drifted into contradicting each
   other across pages, so the count is declared once here and every page reads
   it from this file rather than restating it. */
const CUSTOMERS = '750+'
const RATING = 4.9

export const SOCIAL_PROOF = {
  customers: CUSTOMERS,
  rating: RATING,
  /** Hero star-rating claim, built from the same count the stats band shows. */
  ratingClaim: `${RATING} stars from ${CUSTOMERS} families`,
} as const
