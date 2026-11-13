import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { Button } from '../../../apps/web/src/components/ui/button'

// Figma "Button / Text": flush text with a 24px hit area. Regression: the cv builder used to
// fall back to the default `md` size, so text buttons got px-5 and a 40px control height.
it('text variants sit flush: no size padding or control height, even when a size is passed', () => {
  render(
    <MemoryRouter>
      <Button variant="text">Reset all</Button>
      <Button variant="text" size="sm">Check stock again</Button>
      <Button to="/shop" variant="text-light">Browse</Button>
    </MemoryRouter>,
  )
  for (const name of ['Reset all', 'Check stock again', 'Browse']) {
    const cls = screen.getByRole(name === 'Browse' ? 'link' : 'button', { name }).className
    expect(cls).toContain('min-h-6')
    expect(cls).not.toMatch(/\bpx-\d/)
    expect(cls).not.toContain('min-h-[var(--control-h')
    expect(cls).not.toMatch(/\btext-(body|label)\b/)
  }
})

it('boxed variants still default to the md control size', () => {
  render(<MemoryRouter><Button variant="solid">Add to cart</Button></MemoryRouter>)
  const cls = screen.getByRole('button', { name: 'Add to cart' }).className
  expect(cls).toContain('min-h-[var(--control-h)]')
  expect(cls).toContain('px-5')
})
