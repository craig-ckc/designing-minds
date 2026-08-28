/** Enforce a maximum selection count by keeping only the most recent picks. */
export function enforceMaxSelected(next: string[], maxSelected: number): string[] {
  return next.length > maxSelected ? next.slice(next.length - maxSelected) : next
}

/**
 * The options still worth offering: everything not already picked.
 *
 * A picked option that stays in the dropdown reads as a second, different
 * record — you cannot tell from the list whether the row you are looking at is
 * the one you already added or another one like it. And since removal happens
 * in the chip list below, leaving it there offers a toggle nobody uses.
 *
 * Order is preserved, and `options` is returned unchanged when nothing is
 * selected, so the common case allocates nothing.
 */
export function availableOptions<T extends { value: string }>(
  options: readonly T[],
  selected: readonly string[],
): readonly T[] {
  if (selected.length === 0) return options
  const picked = new Set(selected)
  return options.filter((option) => !picked.has(option.value))
}
