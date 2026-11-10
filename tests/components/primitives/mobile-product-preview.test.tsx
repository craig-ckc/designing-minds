import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { MobileProductPreview } from '../../../apps/web/src/components/ui/mobile-product-preview'

it('links a compact decorative cover to the named full product preview', () => {
  render(<MobileProductPreview item={{ title: 'Mathematics test', grade: 'Grade 4', term: 'Term 1', subjects: ['Mathematics'] }} />)
  const preview = screen.getByRole('link', { name: 'Preview Mathematics test' })
  expect(preview.getAttribute('href')).toBe('#product-preview')
  expect(preview.className).toContain('lg:hidden')
  expect(preview.querySelector('[aria-hidden="true"]')).toBeTruthy()
})
