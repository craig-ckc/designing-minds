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
  it('scopes an Essential Access plan to its own grade and term', () => {
    const plan = product({
      slug: 'essential-access-grade-5-term-1',
      productKind: 'Access Plan',
      grade: 'Grade 5',
      accessPeriod: 'Term',
      includedSubjects: ['mathematics'],
      includedTerms: ['Term 1'],
    })
    expect(resourceUnlockedByPlan(plan, resource('g5-math-t1', 'Grade 5', 'Term 1'))).toBe(true)
    // A different grade must NOT leak in.
    expect(resourceUnlockedByPlan(plan, resource('g7-math-t1', 'Grade 7', 'Term 1'))).toBe(false)
    // A different term must NOT leak in — Essential covers one term.
    expect(resourceUnlockedByPlan(plan, resource('g5-math-t2', 'Grade 5', 'Term 2'))).toBe(false)
    // A subject outside the plan is excluded even at the right grade and term.
    expect(resourceUnlockedByPlan(plan, resource('g5-art-t1', 'Grade 5', 'Term 1', ['art']))).toBe(false)
  })

  it('grants every term for a Premium Access plan (no term filter)', () => {
    const plan = product({
      slug: 'premium-access-grade-4',
      productKind: 'Access Plan',
      grade: 'Grade 4',
      accessPeriod: 'Year',
      includedSubjects: ['mathematics'],
      // includedTerms omitted → all terms for the grade
    })
    expect(resourceUnlockedByPlan(plan, resource('g4-t1', 'Grade 4', 'Term 1'))).toBe(true)
    expect(resourceUnlockedByPlan(plan, resource('g4-t4', 'Grade 4', 'Term 4'))).toBe(true)
    expect(resourceUnlockedByPlan(plan, resource('g4-any', 'Grade 4', 'Any Term' as Term))).toBe(true)
    expect(resourceUnlockedByPlan(plan, resource('g7-t1', 'Grade 7', 'Term 1'))).toBe(false)
  })

  it('scopes a Bundle to its own grade and term', () => {
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

  it('always grants explicitly listed resources and nothing else for a list-only plan', () => {
    const plan = product({
      slug: 'curated-bundle',
      productKind: 'Bundle',
      grade: 'Grade 4',
      includedProductSlugs: ['picked'],
    })
    expect(resourceUnlockedByPlan(plan, resource('picked', 'Grade 7', 'Term 3'))).toBe(true)
    // Same grade, but not on the list and the plan defines no rules → not granted.
    expect(resourceUnlockedByPlan(plan, resource('other', 'Grade 4', 'Term 1'))).toBe(false)
  })

  it('never unlocks non-resources or composites', () => {
    const plan = product({ slug: 'plan', productKind: 'Access Plan', grade: 'Grade 4', includedSubjects: ['mathematics'] })
    const otherBundle = product({ slug: 'b', productKind: 'Bundle', grade: 'Grade 4' })
    expect(resourceUnlockedByPlan(plan, otherBundle)).toBe(false)
  })
})
