import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ChipGroup, FilterDrawer } from '../../../apps/web/src/components/ui/filter-drawer'

// Figma "Filters" sheet: Reset all is Button / Text at 16px semibold. Figma spaces chips 6px; the
// spacing grid snaps that to 8px (design-token-legacy guard).
it('renders Reset all as a flush 16px text button that resets the filters', () => {
  const onReset = vi.fn()
  render(
    <FilterDrawer open onOpenChange={() => {}} onReset={onReset} resultCount={24}>
      <ChipGroup label="Grade" options={['Grade 3', 'Grade 4']} selected={['Grade 4']} onToggle={() => {}} />
    </FilterDrawer>,
  )
  const reset = screen.getByRole('button', { name: 'Reset all' })
  expect(reset.className).toContain('text-body-lg')
  expect(reset.className).toContain('font-semibold')
  expect(reset.className).toContain('text-primary-ink')
  expect(reset.className).not.toMatch(/\bpx-\d/)
  expect(reset.className).not.toContain('min-h-[var(--control-h')
  reset.click()
  expect(onReset).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Show 24 results' })).toBeTruthy()
})

it('spaces filter chips on the 8px grid and reports which are pressed', () => {
  render(<ChipGroup label="Grade" options={['Grade 3', 'Grade 4']} selected={['Grade 4']} onToggle={() => {}} />)
  const chip = screen.getByRole('button', { name: 'Grade 4' })
  expect(chip.getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByRole('button', { name: 'Grade 3' }).getAttribute('aria-pressed')).toBe('false')
  expect(chip.parentElement?.className).toContain('gap-2')
})
