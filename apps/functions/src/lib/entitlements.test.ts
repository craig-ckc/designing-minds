import { describe, expect, it } from 'vitest'
import type { Grade, Product, ProductKind, Term } from '@designing-minds/cms/types'
import { resourceUnlockedByPlan } from '@designing-minds/cms/entitlements'

const product = (overrides: Partial<Product> & Pick<Product, 'slug' | 'productKind'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 0,
  grade: 'Grade 4' as Grade,
  term: 'Term 1' as Term,
  year: '2026',
  resourceFormat: 'Test / Assessment',
  subjects: ['mathematics'],
  marks: null,
  purchasedFiles: [],
  featured: false,
  published: true,
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  ...overrides,
})

const resource = (slug: string, grade: Grade, term: Term, subjects: string[] = ['mathematics']): Product =>
  product({ slug, productKind: 'Individual Resource' as ProductKind, grade, term, subjects })

describe('resourceUnlockedByPlan', () => {
  it('scopes an Access Plan to the grade chosen at checkout', () => {
    const plan = product({
      slug: 'essential-access',
      productKind: 'Access Plan',
      includedGrades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
      includedSubjects: ['mathematics'],
    })
    expect(resourceUnlockedByPlan(plan, resource('g5-math', 'Grade 5', 'Term 1'), 'Grade 5')).toBe(true)
    // A different grade in the plan's eligibility must NOT leak in once a grade is chosen.
    expect(resourceUnlockedByPlan(plan, resource('g7-math', 'Grade 7', 'Term 1'), 'Grade 5')).toBe(false)
    // A subject outside the plan is excluded even at the right grade.
    expect(resourceUnlockedByPlan(plan, resource('g5-art', 'Grade 5', 'Term 1', ['art']), 'Grade 5')).toBe(false)
  })

  it('falls back to a Bundle’s own grade when no grade is captured', () => {
    const bundle = product({
      slug: 'g7-term1-bundle',
      productKind: 'Bundle',
      grade: 'Grade 7',
      includedSubjects: ['mathematics'],
      includedTerms: ['Term 1'],
    })
    expect(resourceUnlockedByPlan(bundle, resource('g7-math-t1', 'Grade 7', 'Term 1'))).toBe(true)
    expect(resourceUnlockedByPlan(bundle, resource('g4-math-t1', 'Grade 4', 'Term 1'))).toBe(false)
    expect(resourceUnlockedByPlan(bundle, resource('g7-math-t2', 'Grade 7', 'Term 2'))).toBe(false)
  })

  it('falls back to eligible grades for a legacy Access Plan order with no grade', () => {
    const plan = product({
      slug: 'essential-access',
      productKind: 'Access Plan',
      includedGrades: ['Grade 3', 'Grade 4'],
      includedSubjects: ['mathematics'],
    })
    expect(resourceUnlockedByPlan(plan, resource('g4', 'Grade 4', 'Term 1'))).toBe(true)
    expect(resourceUnlockedByPlan(plan, resource('g7', 'Grade 7', 'Term 1'))).toBe(false)
  })

  it('always grants explicitly listed resources and nothing else for a list-only plan', () => {
    const plan = product({
      slug: 'curated-bundle',
      productKind: 'Bundle',
      grade: 'Grade 4',
      includedProductSlugs: ['picked'],
    })
    expect(resourceUnlockedByPlan(plan, resource('picked', 'Grade 7', 'Term 3'), 'Grade 4')).toBe(true)
    // Same grade, but not on the list and the plan defines no rules → not granted.
    expect(resourceUnlockedByPlan(plan, resource('other', 'Grade 4', 'Term 1'), 'Grade 4')).toBe(false)
  })

  it('never unlocks non-resources or composites', () => {
    const plan = product({ slug: 'plan', productKind: 'Access Plan', includedSubjects: ['mathematics'] })
    const otherBundle = product({ slug: 'b', productKind: 'Bundle', grade: 'Grade 4' })
    expect(resourceUnlockedByPlan(plan, otherBundle, 'Grade 4')).toBe(false)
  })
})
