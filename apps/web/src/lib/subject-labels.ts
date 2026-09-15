import type { CmsSnapshot, Product } from '@designing-minds/cms'

/* -------------------------------------------------------------------------
   Subject labelling + grade-page SEO copy.

   Pure module: no import from ./content/site (which pulls a JSON file
   without an import attribute and fails to load under node's
   --experimental-strip-types). Everything a caller needs — the site name,
   the grade's fallback blurb — is passed in as a parameter instead.
   ------------------------------------------------------------------------- */

/** Life Skills' Personal and Social Well-being strand — Grades 4–6 only. */
export const PSW_SUBJECT = 'Life Skills (PSW)'

const SUBJECT_SHORT_LABELS: Record<string, string> = {
  'Afrikaans First Additional Language': 'Afrikaans FAL',
  'English First Additional Language': 'English FAL',
  'English Home Language': 'English HL',
  'Economic Management Sciences (EMS)': 'EMS',
  'Natural Science and Technology': 'NST',
  Mathematics: 'Maths',
}

/** Short, snippet-friendly form of a subject name. Unmapped subjects pass through unchanged. */
export const subjectShortLabel = (subject: string): string => SUBJECT_SHORT_LABELS[subject] ?? subject

/**
 * Distinct subjects of published products in a grade, most-represented first
 * (ties broken alphabetically) — the order a grade page's subject nav and
 * meta copy read off.
 */
export const subjectsForGrade = (snapshot: Pick<CmsSnapshot, 'products'>, grade: string): string[] => {
  const counts = new Map<string, number>()
  for (const product of snapshot.products) {
    if (!product.published || product.grade !== grade) continue
    for (const subject of product.subjects) {
      counts.set(subject, (counts.get(subject) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort(([subjectA, countA], [subjectB, countB]) => countB - countA || subjectA.localeCompare(subjectB))
    .map(([subject]) => subject)
}

const MAX_DESCRIPTION_LENGTH = 160

/* Search results show roughly 60 characters of a title before cutting it, so
   the part before " | Designing Minds" is kept inside that budget. Title
   labels are shorter still than the snippet labels: the HL/FAL codes mean
   nothing to a searcher scanning results, and collapsing them lets "English"
   stand once for both language streams. */
const MAX_TITLE_HEAD_LENGTH = 60
const TITLE_LABELS: Record<string, string> = {
  [PSW_SUBJECT]: 'PSW',
  'English Home Language': 'English',
  'English First Additional Language': 'English',
  'Afrikaans First Additional Language': 'Afrikaans',
  'Economic Management Sciences (EMS)': 'EMS',
  'Natural Science and Technology': 'NST',
  Mathematics: 'Maths',
}
const titleLabel = (subject: string): string => TITLE_LABELS[subject] ?? subject

/**
 * Title + description for a grade listing page. Subject-aware so a query like
 * "psw grade 5" matches the snippet: PSW is hoisted to the front of the title
 * teaser whenever the grade carries it, and the description names every
 * subject the grade covers (shrinking to "& more" only if it would otherwise
 * blow the 160-character budget).
 */
export function gradePageMeta(input: {
  grade: string
  blurb: string
  /** Published products of this grade. */
  products: Product[]
  siteName?: string
}): { title: string; description: string } {
  const { grade, blurb, products, siteName = 'Designing Minds' } = input

  if (products.length === 0) {
    return { title: `${grade} CAPS resources | ${siteName}`, description: blurb }
  }

  const baseOrder = subjectsForGrade({ products }, grade)
  const orderedSubjects = baseOrder.includes(PSW_SUBJECT)
    ? [PSW_SUBJECT, ...baseOrder.filter((subject) => subject !== PSW_SUBJECT)]
    : baseOrder

  // Up to three subjects, fewer if that is what fits the snippet budget.
  const teaserLabels = [...new Set(orderedSubjects.map(titleLabel))]
  const titleHead = (shown: number) =>
    `${grade} CAPS tests & memos: ${teaserLabels.slice(0, shown).join(', ')}${teaserLabels.length > shown ? ' & more' : ''}`
  let shown = Math.min(3, teaserLabels.length)
  while (titleHead(shown).length > MAX_TITLE_HEAD_LENGTH && shown > 1) shown -= 1
  const title = `${titleHead(shown)} | ${siteName}`

  const kinds = products.some((product) => product.resourceFormat === 'Summary')
    ? 'tests, memos and summaries'
    : 'tests and memos'

  let labelSubjects = orderedSubjects
  const buildDescription = () => {
    const truncated = labelSubjects.length < orderedSubjects.length
    const labels = labelSubjects.map(subjectShortLabel).join(', ') + (truncated ? ' & more' : '')
    return `${products.length} CAPS-aligned ${grade} ${kinds}: ${labels}. Instant PDF download; print at home.`
  }

  let description = buildDescription()
  while (description.length > MAX_DESCRIPTION_LENGTH && labelSubjects.length > 1) {
    labelSubjects = labelSubjects.slice(0, -1)
    description = buildDescription()
  }

  return { title, description }
}
