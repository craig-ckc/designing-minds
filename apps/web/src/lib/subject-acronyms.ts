/* South African language-subject codes. They appear in dozens of product titles
   and subject names ("English HL", "Afrikaans FAL") and were never expanded
   anywhere on the site — obvious to a local teacher, opaque to a parent new to
   the system and to any AI summarising the catalogue.
 */

const SUBJECT_ACRONYMS: Record<string, string> = {
  HL: 'Home Language',
  FAL: 'First Additional Language',
  SAL: 'Second Additional Language',
}

/** The acronyms used anywhere in `text`, in the order they are defined above. */
export const subjectAcronymsIn = (text: string): { code: string; meaning: string }[] =>
  Object.entries(SUBJECT_ACRONYMS)
    .filter(([code]) => new RegExp(`\\b${code}\\b`).test(text))
    .map(([code, meaning]) => ({ code, meaning }))
