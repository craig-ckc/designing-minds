/* -------------------------------------------------------------------------
   Which years an editor may pick, and which one a new record starts on.

   `value_lists.years` was a literal array in the schema — ['2024','2025','2026'].
   A hardcoded set of dates has an expiry date of its own: in 2027 nobody could
   file next year's material without a database migration. Worse, `createBlank`
   defaulted a new record to `years[0]`, which is the *oldest* entry — so every
   product and bundle created since has started life filed under 2024.

   So the window is computed from the clock instead. The stored list is folded
   in rather than replaced: a record already filed under a year that has since
   dropped out of the window has to keep a valid option, or the Select would
   hold a value it has no entry for and quietly rewrite it on the next save.

   Both functions take `now` so they can be tested without mocking the clock.
   ------------------------------------------------------------------------- */

/** How far the window reaches either side of today. */
const YEARS_BACK = 2
const YEARS_AHEAD = 1

/** The year a new record starts on — today's, not the oldest on file. */
export const currentYear = (now: Date = new Date()): string => String(now.getFullYear())

/**
 * Sorts four-digit years newest-first, and keeps anything else rather than
 * dropping it: an unexpected value is still some record's current value, and
 * losing its option would be the bug this function exists to prevent.
 */
const rank = (value: string): number => (/^\d{4}$/.test(value) ? Number(value) : -1)

export function yearOptions(stored: readonly string[] = [], now: Date = new Date()): string[] {
  const year = now.getFullYear()
  const window: string[] = []
  for (let y = year - YEARS_BACK; y <= year + YEARS_AHEAD; y += 1) window.push(String(y))

  // Newest first: an editor is nearly always filing this year's or next year's
  // material, so those belong at the top rather than the bottom of the list.
  return [...new Set([...window, ...stored])].sort((a, b) => rank(b) - rank(a) || a.localeCompare(b))
}
