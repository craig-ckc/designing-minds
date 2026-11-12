import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ProductMedia } from '../../../apps/web/src/components/ui/product-media'

it('renders a lazy async image with alt when src is given', () => {
  render(<ProductMedia src="/cover.png" alt="Grade 4 workbook" width={400} height={400}><span>child</span></ProductMedia>)
  const img = screen.getByRole('img', { name: 'Grade 4 workbook' })
  expect(img.getAttribute('src')).toBe('/cover.png')
  expect(img.getAttribute('loading')).toBe('lazy')
  expect(img.getAttribute('decoding')).toBe('async')
  expect(screen.queryByText('child')).toBeNull()
})

it('renders children when there is no src', () => {
  render(<ProductMedia alt="Cover"><span>live cover</span></ProductMedia>)
  expect(screen.getByText('live cover')).toBeTruthy()
  expect(screen.queryByRole('img')).toBeNull()
})

it('renders an empty frame when neither is given', () => {
  const { container } = render(<ProductMedia alt="Cover" />)
  expect(container.firstElementChild?.childNodes.length).toBe(0)
  expect(container.textContent).toBe('')
})

it('uses cover fit for photos', () => {
  render(<ProductMedia src="/p.jpg" alt="Photo" fit="cover" aspect="4/3" />)
  expect(screen.getByRole('img').className).toContain('object-cover')
})
