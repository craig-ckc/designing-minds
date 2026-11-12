import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { Button } from '../../../apps/web/src/components/ui/button'
import { Icon } from '../../../apps/web/src/components/ui/icon'

it('ghost is transparent with no border and works icon-only', () => {
  render(<MemoryRouter><Button variant="ghost" size="icon" aria-label="Remove item"><Icon name="trash" size={16} /></Button></MemoryRouter>)
  const cls = screen.getByRole('button', { name: 'Remove item' }).className
  expect(cls).toContain('bg-transparent')
  expect(cls).toContain('hover:bg-surface-sunk')
  expect(cls).toContain('text-ink')
  expect(cls).not.toContain('border')
  expect(cls).toContain('h-10 w-10')
})
