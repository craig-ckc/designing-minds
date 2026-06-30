import type { CmsSnapshot } from '../types'

/* -------------------------------------------------------------------------
   Public snapshot sanitization.

   The build-time snapshot embedded in static HTML must be public by
   construction. Even with RLS restricting the public Supabase client, the
   static pipeline must never serialize operational records (customers, orders,
   payments) or unpublished/hidden catalogue content. toPublicSnapshot() is the
   single chokepoint that guarantees this.
   ------------------------------------------------------------------------- */

/**
 * Strip a full CMS snapshot down to public catalogue content only:
 * - products: published only (storage keys are already removed upstream by the
 *   catalog_products view)
 * - subjects: visible only
 * - faqs / testimonials: published only
 * - customers / orders / payments: always empty
 * - stats: recalculated from the public content
 *
 * Returns a `CmsSnapshot` (same shape) so the web client can hydrate from it
 * without a separate type, with operational arrays guaranteed empty.
 */
export const toPublicSnapshot = (snapshot: CmsSnapshot): CmsSnapshot => {
  const products = snapshot.products.filter((product) => product.published)
  const subjects = snapshot.subjects.filter((subject) => subject.visible)
  const faqs = snapshot.faqs.filter((faq) => faq.published)
  const testimonials = snapshot.testimonials.filter((testimonial) => testimonial.published)

  return {
    generatedAt: snapshot.generatedAt,
    source: snapshot.source,
    valueLists: snapshot.valueLists,
    products,
    subjects,
    faqs,
    testimonials,
    customers: [],
    orders: [],
    payments: [],
    stats: {
      productCount: products.length,
      subjectCount: subjects.length,
      gradeCount: snapshot.valueLists.grades.length,
      bundleCount: products.filter((product) => product.productKind === 'Bundle').length,
      accessPlanCount: products.filter((product) => product.productKind === 'Access Plan').length,
      orderCount: 0,
      customerCount: 0,
    },
  }
}
