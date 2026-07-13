export type SubjectIllustration =
  | 'subjects/afrikaans.avif'
  | 'subjects/economic.avif'
  | 'subjects/english.avif'
  | 'subjects/geography.avif'
  | 'subjects/history.avif'
  | 'subjects/life-science.avif'
  | 'subjects/mathematics.avif'
  | 'subjects/science.avif'
  | 'subjects/technology.avif'
  | 'covers/arts.svg'
  | 'covers/general.svg'

type Colorway = { band: string; fg: string; solid: string }

const TERM_COLORWAYS: Record<string, Colorway> = {
  'Any Term': { band: 'text-lagoon', fg: 'text-teal', solid: 'bg-teal' },
  'Term 1': { band: 'text-butter', fg: 'text-amber', solid: 'bg-amber' },
  'Term 2': { band: 'text-blossom', fg: 'text-magenta', solid: 'bg-magenta' },
  'Term 3': { band: 'text-meadow', fg: 'text-forest', solid: 'bg-forest' },
  'Term 4': { band: 'text-periwinkle', fg: 'text-navy', solid: 'bg-navy' },
}

const SUBJECT_ILLUSTRATIONS: Record<string, SubjectIllustration> = {
  'Afrikaans First Additional Language': 'subjects/afrikaans.avif',
  'Economic Management Sciences (EMS)': 'subjects/economic.avif',
  'English First Additional Language': 'subjects/english.avif',
  'English Home Language': 'subjects/english.avif',
  Geography: 'subjects/geography.avif',
  History: 'subjects/history.avif',
  'Life Orientation': 'subjects/life-science.avif',
  'Life Skills': 'subjects/life-science.avif',
  'Life Skills (PSW)': 'subjects/life-science.avif',
  Mathematics: 'subjects/mathematics.avif',
  'Natural Science': 'subjects/science.avif',
  'Natural Science and Technology': 'subjects/science.avif',
  Technology: 'subjects/technology.avif',
}

/** Cover colour is controlled by the seeded term vocabulary, not grade. */
export function termColorway(term: string): Colorway {
  return TERM_COLORWAYS[term] ?? TERM_COLORWAYS['Any Term']
}

/** Map every seeded subject explicitly, while tolerating future free-text values. */
export function subjectIllustration(subject: string): SubjectIllustration {
  const mapped = SUBJECT_ILLUSTRATIONS[subject]
  if (mapped) return mapped

  const s = subject.toLowerCase()
  if (/(math|number|numerac)/.test(s)) return 'subjects/mathematics.avif'
  if (/afrikaans/.test(s)) return 'subjects/afrikaans.avif'
  if (/(english|language|read|literac|\bfal\b|\bhl\b)/.test(s)) return 'subjects/english.avif'
  if (/geograph/.test(s)) return 'subjects/geography.avif'
  if (/history/.test(s)) return 'subjects/history.avif'
  if (/(life\s?(skill|orientation)|\bpsw\b)/.test(s)) return 'subjects/life-science.avif'
  if (/(economic|\bems\b)/.test(s)) return 'subjects/economic.avif'
  if (/technology/.test(s)) return 'subjects/technology.avif'
  if (/(science|nst|natural|biolog|chem|physic)/.test(s)) return 'subjects/science.avif'
  if (/(\barts?\b|creativ|music|visual)/.test(s)) return 'covers/arts.svg'
  return 'covers/general.svg'
}
