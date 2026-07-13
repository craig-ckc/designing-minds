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
