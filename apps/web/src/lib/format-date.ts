const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * "2026-11-04" or "2026-11-04T23:59:59Z" -> "4 Nov 2026". Reads the calendar
 * date straight from the ISO text (the UTC date), never through Date or Intl,
 * so server and browser render identically whatever their timezone or locale.
 * Anything that is not an ISO date is returned unchanged.
 */
export function formatDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return iso
  return `${Number(match[3])} ${month} ${match[1]}`
}
