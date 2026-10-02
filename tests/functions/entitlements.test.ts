import { describe, expect, it } from 'vitest'
import type { Bundle, Grade, Product, Term } from '@designing-minds/cms/types'
import { resourceUnlockedByBundle } from '@designing-minds/cms/entitlements'

/* -------------------------------------------------------------------------
   Download entitlement for a purchased bundle: membership is the whole
   answer. Bundles used to grant by rule too (grade + includedSubjects +
   includedTerms, via the retired resourceUnlockedByPlan); the 2026-08-09
   bundles migration resolved every rule into explicit bundle_products rows
   and retired Access Plans, so these tests pin that NOTHING is granted by
   resemblance any more — only by being listed.
   ------------------------------------------------------------------------- */

const resource = (slug: string, grade: Grade = 'Grade 4', term: Term = 'Term 1', subjects = ['Mathematics']): Pick<Product, 'slug' | 'grade' | 'term' | 'subjects'> => ({
  slug,
  grade,
  term,
  subjects,
})

const bundle = (includedProductSlugs: string[]): Pick<Bundle, 'includedProductSlugs'> => ({ includedProductSlugs })

describe('resourceUnlockedByBundle', () => {
  it('grants every listed member', () => {
    const owned = bundle(['g4-maths-t1', 'g4-english-t1'])
    expect(resourceUnlockedByBundle(owned, resource('g4-maths-t1'))).toBe(true)
    expect(resourceUnlockedByBundle(owned, resource('g4-english-t1'))).toBe(true)
  })

  it('does not grant an unlisted resource that merely matches the bundle’s grade, term and subject', () => {
    // The old rule-based grant would have unlocked this; membership does not.
    const owned = bundle(['g4-maths-t1'])
    expect(resourceUnlockedByBundle(owned, resource('g4-maths-t1-test-2', 'Grade 4', 'Term 1', ['Mathematics']))).toBe(false)
  })

  it('grants a listed member regardless of its own grade or term', () => {
    const owned = bundle(['g7-maths-t3'])
    expect(resourceUnlockedByBundle(owned, resource('g7-maths-t3', 'Grade 7', 'Term 3'))).toBe(true)
  })

  it('grants nothing from an empty bundle', () => {
    expect(resourceUnlockedByBundle(bundle([]), resource('anything'))).toBe(false)
  })

  it('matches slugs exactly, never by prefix or case', () => {
    const owned = bundle(['g4-maths-t1'])
    expect(resourceUnlockedByBundle(owned, resource('g4-maths'))).toBe(false)
    expect(resourceUnlockedByBundle(owned, resource('g4-maths-t1-extra'))).toBe(false)
    expect(resourceUnlockedByBundle(owned, resource('G4-MATHS-T1'))).toBe(false)
  })
})
