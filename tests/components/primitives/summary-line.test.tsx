import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { SummaryLine } from '../../../apps/web/src/components/summary-line'
import { makeBundle, makeProduct, makeSnapshot } from '../../support/fixtures'

const maths = makeProduct({ slug: 'maths', title: 'Maths test', grade: 'Grade 4', term: 'Term 1', priceZar: 50 })
const english = makeProduct({ slug: 'english', title: 'English test', grade: 'Grade 4', term: 'Term 3', priceZar: 50 })
const draft = makeProduct({ slug: 'draft', title: 'Draft test', grade: 'Grade 4', term: 'Term 3', published: false })
const bundle = makeBundle({ slug: 'term-3', title: 'Term 3 bundle', grade: 'Grade 4', term: 'Term 3', priceZar: 80, includedProductSlugs: ['maths', 'english', 'draft'] })
const single = makeBundle({ slug: 'solo', title: 'Solo bundle', grade: 'Grade 4', term: 'Term 3', includedProductSlugs: ['maths'] })
const empty = makeBundle({ slug: 'empty', title: 'Empty bundle', grade: 'Grade 4', term: 'Term 3', includedProductSlugs: [] })
const snapshot = makeSnapshot({ products: [maths, english, draft], bundles: [bundle, single, empty] })

const show = (props: Partial<Parameters<typeof SummaryLine>[0]> & Pick<Parameters<typeof SummaryLine>[0], 'slug' | 'title'>) =>
  render(<MemoryRouter><ul><SummaryLine snapshot={snapshot} physical={false} price={50} {...props} /></ul></MemoryRouter>)

it('reads a single resource as grade and term, adding "Single" only for receipts', () => {
  const view = show({ slug: 'maths', title: 'Maths test' })
  expect(screen.getByText('Grade 4 · Term 1')).toBeTruthy()
  view.unmount()
  show({ slug: 'maths', title: 'Maths test', showKind: true })
  expect(screen.getByText('Single · Grade 4 · Term 1')).toBeTruthy()
})

it('counts a bundle’s published resources in its meta', () => {
  const view = show({ slug: 'term-3', title: 'Term 3 bundle', price: 80 })
  expect(screen.getByText('Bundle · Grade 4 · Term 3 · 2 resources')).toBeTruthy()
  view.unmount()
  const solo = show({ slug: 'solo', title: 'Solo bundle', price: 80 })
  expect(screen.getByText('Bundle · Grade 4 · Term 3 · 1 resource')).toBeTruthy()
  solo.unmount()
  show({ slug: 'empty', title: 'Empty bundle', price: 80, showKind: true })
  expect(screen.getByText('Bundle · Grade 4 · Term 3')).toBeTruthy()
})

it('reads a physical line as a short quantity and keeps its options line', () => {
  const view = show({ slug: 'keyring', title: 'Keyring', physical: true, quantity: 2, price: 178, values: { colour: 'Pink', name: 'Thandi' } })
  expect(screen.getByText('Qty 2')).toBeTruthy()
  expect(screen.getByText('Colour: Pink · Name: Thandi')).toBeTruthy()
  view.unmount()
  show({ slug: 'keyring', title: 'Keyring', physical: true, quantity: 2, unitPriceZar: 89, price: 178 })
  expect(screen.getByText(/^Qty 2 × R\s?89$/)).toBeTruthy()
})

it('stacks a struck original price above the current price with spoken labels', () => {
  const { container } = show({ slug: 'term-3', title: 'Term 3 bundle', price: 200, originalPriceZar: 360 })
  const struck = container.querySelector('s')!
  expect(struck.textContent).toMatch(/360/)
  const column = container.querySelector('li')!.lastElementChild!
  expect(column.className).toContain('flex-col')
  expect(column.firstElementChild?.contains(struck)).toBe(true)
  expect(column.firstElementChild?.className).toContain('text-caption')
  expect(column.lastElementChild?.textContent).toMatch(/^Sale price R\s?200$/)
  expect(column.textContent).toMatch(/^Original price R\s?360/)
})

it('shows no struck price when the original is not higher', () => {
  const { container } = show({ slug: 'maths', title: 'Maths test', price: 50, originalPriceZar: 50 })
  expect(container.querySelector('s')).toBeNull()
  expect(container.textContent).not.toContain('Original price')
})
