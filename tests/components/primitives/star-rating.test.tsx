import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { StarRating } from '../../../apps/web/src/components/ui/star-rating'

it('renders five svg stars with the rounded value filled and keeps the accessible name', () => {
  const { container } = render(<StarRating value={3.6} />)
  expect(screen.getByRole('img', { name: '3.6 out of 5 stars' })).toBeTruthy()
  expect(container.querySelectorAll('svg').length).toBe(5)
  expect(container.querySelectorAll('[data-filled]').length).toBe(4)
  expect(container.textContent).not.toContain('★')
})

it('sizes stars 16px for sm and 18px for md', () => {
  const sm = render(<StarRating size="sm" />).container.querySelector('svg')
  expect(sm?.getAttribute('width')).toBe('16')
  const md = render(<StarRating />).container.querySelector('svg')
  expect(md?.getAttribute('width')).toBe('18')
})
