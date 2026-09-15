/**
 * Typographic apostrophes.
 *
 * CMS copy arrives with whichever apostrophe the editor's keyboard produced:
 * "learner's" on one product, "learner’s" on the next. Readers notice the
 * mismatch and text analysis counts the two spellings as different words, so a
 * rendered text run curls any apostrophe that sits between letters. Nothing
 * else is touched — quotes around a word, code, and numbers stay as typed.
 */
export const typographicApostrophes = (text: string): string => text.replace(/(\p{L})'(\p{L})/gu, '$1’$2')
