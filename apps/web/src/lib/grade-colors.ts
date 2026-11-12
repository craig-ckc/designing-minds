// Grade → colour-way, shared by the product cover and the grade cards so a
// grade always reads in the same colour across the site. Five grades, five
// distinct pastel pairings (band = soft fill, fg = text, solid = strong fill).

export type Colorway = { band: string; fg: string; solid: string }

const GRADE_COLORWAYS: Colorway[] = [
  { band: 'bg-yellow', fg: 'text-on-yellow', solid: 'bg-on-yellow' },
  { band: 'bg-magenta', fg: 'text-on-magenta', solid: 'bg-on-magenta' },
  { band: 'bg-green', fg: 'text-on-green', solid: 'bg-on-green' },
  { band: 'bg-blue', fg: 'text-on-blue', solid: 'bg-on-blue' },
  { band: 'bg-teal', fg: 'text-on-teal', solid: 'bg-on-teal' },
]

/** Grade 3 → index 0, Grade 4 → 1, … cycling for any extra grades. */
export function gradeColorway(grade: string): Colorway {
  const n = Number.parseInt(grade.replace(/\D+/g, ''), 10)
  const raw = Number.isFinite(n) ? n - 3 : 0
  const index = ((raw % GRADE_COLORWAYS.length) + GRADE_COLORWAYS.length) % GRADE_COLORWAYS.length
  return GRADE_COLORWAYS[index]
}
