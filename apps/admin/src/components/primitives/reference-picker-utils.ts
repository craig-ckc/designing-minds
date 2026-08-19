/** Enforce a maximum selection count by keeping only the most recent picks. */
export function enforceMaxSelected(next: string[], maxSelected: number): string[] {
  return next.length > maxSelected ? next.slice(next.length - maxSelected) : next
}
