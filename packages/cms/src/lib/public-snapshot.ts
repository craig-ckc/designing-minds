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
 * - bundles: published only, and their membership narrowed to published
 *   resources so the site can never advertise contents a buyer can't get
 * - faqs / testimonials: published only
 * - customers / orders / payments / form submissions: always empty
 * - stats: recalculated from the public content
 *
 * Returns a `CmsSnapshot` (same shape) so the web client can hydrate from it
 * without a separate type, with operational arrays guaranteed empty.
 */
export const toPublicSnapshot = (snapshot: CmsSnapshot): CmsSnapshot => {
  const products = snapshot.products.filter((product) => product.published)
  const faqs = snapshot.faqs.filter((faq) => faq.published)
  const testimonials = snapshot.testimonials.filter((testimonial) => testimonial.published)

  // catalog_bundles already does this server-side, but the admin snapshot
  // reads the base table — so re-narrow here rather than trusting the source.
  const liveSlugs = new Set(products.map((product) => product.slug))
  const bundles = snapshot.bundles
    .filter((bundle) => bundle.published)
    .map((bundle) => {
      const keep = bundle.includedProductSlugs
        .map((slug, index) => ({ slug, id: bundle.includedProductIds[index] }))
        .filter((member) => liveSlugs.has(member.slug))
      return {
        ...bundle,
        includedProductSlugs: keep.map((member) => member.slug),
        includedProductIds: keep.map((member) => member.id).filter(Boolean),
      }
    })

  return {
    generatedAt: snapshot.generatedAt,
    source: snapshot.source,
    valueLists: snapshot.valueLists,
    products,
    bundles,
    faqs,
    testimonials,
    customers: [],
    orders: [],
    payments: [],
    formContact: [],
    formNewsletter: [],
    stats: {
      productCount: products.length,
      subjectCount: snapshot.valueLists.subjects.length,
      gradeCount: snapshot.valueLists.grades.length,
      bundleCount: bundles.length,
      orderCount: 0,
      customerCount: 0,
    },
  }
}
