/* Brand-level static content. Catalogue data (products, subjects, FAQs,
   testimonials) now comes from the CMS snapshot — not this file. */

export const PROOF_POINTS = ['Teacher-led', 'CAPS aligned', 'Grades 3–7', 'Printable PDFs', 'Instant download']

export const WHY_FEATURES = [
  { title: 'CAPS-Aligned Curriculum', body: 'Every resource follows the latest CAPS Annual Teaching Plan for the grade.' },
  { title: 'Memorandums Included', body: 'Assessments ship with a clear marking memorandum for stress-free marking.' },
  { title: 'Instant Download & Access', body: 'Files unlock on your order page the moment payment succeeds. Print anytime.' },
  { title: 'Builds Exam Confidence', body: 'Structured practice helps learners feel prepared and confident in assessments.' },
]

export const CONTACT = {
  phone: '+27 84 605 5217',
  email: 'designingminds123@gmail.com',
  location: 'Port Elizabeth, South Africa',
}

export const GRADE_BLURB: Record<string, string> = {
  'Grade 3': 'Foundation-phase practice that builds early confidence.',
  'Grade 4': 'Intermediate-phase tests across all core subjects.',
  'Grade 5': 'Term-by-term assessments aligned to the CAPS plan.',
  'Grade 6': 'Exam-style practice to prepare for senior phase.',
  'Grade 7': 'Senior-phase tests and full-year bundles.',
}

/** Grade label <-> URL slug helpers, e.g. "Grade 4" <-> "grade-4". */
export const gradeToSlug = (grade: string) => grade.toLowerCase().replace(/\s+/g, '-')
export const slugToGrade = (slug: string) =>
  slug.replace(/grade-(\d+)/i, (_match, n) => `Grade ${n}`)
