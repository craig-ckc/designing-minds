import {
  cloneSnapshot,
  updateFaqInSnapshot,
  updateProductInSnapshot,
  updateSubjectInSnapshot,
  updateTestimonialInSnapshot,
} from '../lib/formatters'
import { fixtureSnapshot } from '../fixtures'
import type { CmsRepository, CmsSnapshot, Faq, Product, Subject, Testimonial } from '../types'

// Bump the version when the snapshot shape changes so stale localStorage
// (e.g. the pre-rename `controlledFields` shape) is discarded and re-seeded.
const STORAGE_KEY = 'designing-minds.cms.snapshot.v3'

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readSnapshot = (): CmsSnapshot => {
  if (!hasWindow()) {
    return cloneSnapshot(fixtureSnapshot)
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fixtureSnapshot))
    return cloneSnapshot(fixtureSnapshot)
  }
  try {
    return JSON.parse(raw) as CmsSnapshot
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fixtureSnapshot))
    return cloneSnapshot(fixtureSnapshot)
  }
}

const writeSnapshot = (snapshot: CmsSnapshot) => {
  if (hasWindow()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }
}

/** Editable wireframe content backed by browser localStorage. */
export const createLocalRepository = (): CmsRepository => ({
  mode: 'local',
  canWrite: true,
  async getSnapshot() {
    return readSnapshot()
  },
  async saveProduct(product: Product) {
    const next = updateProductInSnapshot(readSnapshot(), { ...product, updatedAt: new Date().toISOString() })
    writeSnapshot(next)
    return next.products.find((entry) => entry.id === product.id) ?? product
  },
  async saveSubject(subject: Subject) {
    const next = updateSubjectInSnapshot(readSnapshot(), subject)
    writeSnapshot(next)
    return next.subjects.find((entry) => entry.id === subject.id) ?? subject
  },
  async saveFaq(faq: Faq) {
    const next = updateFaqInSnapshot(readSnapshot(), faq)
    writeSnapshot(next)
    return next.faqs.find((entry) => entry.id === faq.id) ?? faq
  },
  async saveTestimonial(testimonial: Testimonial) {
    const next = updateTestimonialInSnapshot(readSnapshot(), testimonial)
    writeSnapshot(next)
    return next.testimonials.find((entry) => entry.id === testimonial.id) ?? testimonial
  },
  async reset() {
    writeSnapshot(cloneSnapshot(fixtureSnapshot))
  },
})
