/* -------------------------------------------------------------------------
   CMS Data Adapter — the boundary between the generic workspace and the typed
   @designing-minds/cms repository + snapshot.

   - Reads map the loaded snapshot to display-ready AdminRecords. Editable
     collections pass their domain objects straight through; read-only
     operations are flattened into label fields the generic editor can show.
   - save() is the only per-collection branch: it dispatches to the repository's
     typed save method and returns a snapshot mutator to fold the result back in.
   - uploadFile() reuses the server signed-upload flow (was inline in the old
     ProductEditorPage).
   ------------------------------------------------------------------------- */

import {
  formatCurrency,
  ordersForCustomer,
  updateFaqInSnapshot,
  updateProductInSnapshot,
  updateSubjectInSnapshot,
  updateTestimonialInSnapshot,
  type CmsRepository,
  type CmsSnapshot,
  type Faq,
  type Product,
  type ProductFile,
  type Subject,
  type Testimonial,
} from '@designing-minds/cms'
import { supabase } from '../lib/supabase'
import { apiUrl } from '../lib/api'
import type { AdminCollection, AdminRecord, FieldContext, FieldOption, ReferenceField, SelectField } from './types'
import { getPath } from './record'

/* -------------------------------- Reads -------------------------------- */

function mapOrder(snapshot: CmsSnapshot, order: CmsSnapshot['orders'][number]): AdminRecord {
  const payment = snapshot.payments.find((p) => p.id === order.paymentId)
  const itemsSummary = order.items.length
    ? order.items.map((item) => `${item.title} — ${item.productKind} — ${formatCurrency(item.priceZar)}`).join('\n')
    : 'No items.'
  const paymentSummary = payment
    ? `${payment.provider} · ${payment.reference} · ${formatCurrency(payment.amountZar)} · ${payment.status}`
    : 'No payment record.'
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    date: order.placedAt.slice(0, 10),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    itemCount: order.items.length,
    total: order.totalZar,
    totalLabel: formatCurrency(order.totalZar),
    itemsSummary,
    paymentSummary,
  }
}

function mapCustomer(snapshot: CmsSnapshot, customer: CmsSnapshot['customers'][number]): AdminRecord {
  const orders = ordersForCustomer(snapshot, customer.id)
  const ltv = orders.reduce((sum, order) => sum + order.totalZar, 0)
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    joined: customer.createdAt.slice(0, 10),
    orderCount: orders.length,
    ltv,
    ltvLabel: formatCurrency(ltv),
  }
}

function mapPayment(snapshot: CmsSnapshot, payment: CmsSnapshot['payments'][number]): AdminRecord {
  const order = snapshot.orders.find((o) => o.id === payment.orderId)
  return {
    id: payment.id,
    reference: payment.reference,
    orderReference: order?.reference ?? payment.orderId,
    provider: payment.provider,
    date: payment.createdAt.slice(0, 10),
    status: payment.status,
    amount: payment.amountZar,
    amountLabel: formatCurrency(payment.amountZar),
  }
}

export function selectRecords(snapshot: CmsSnapshot, collectionId: string): AdminRecord[] {
  switch (collectionId) {
    case 'products':
      return snapshot.products as unknown as AdminRecord[]
    case 'subjects':
      return snapshot.subjects as unknown as AdminRecord[]
    case 'faqs':
      return snapshot.faqs as unknown as AdminRecord[]
    case 'testimonials':
      return snapshot.testimonials as unknown as AdminRecord[]
    case 'orders':
      return snapshot.orders.map((order) => mapOrder(snapshot, order))
    case 'customers':
      return snapshot.customers.map((customer) => mapCustomer(snapshot, customer))
    case 'payments':
      return snapshot.payments.map((payment) => mapPayment(snapshot, payment))
    default:
      return []
  }
}

export function selectRecord(snapshot: CmsSnapshot, collectionId: string, id: string): AdminRecord | undefined {
  return selectRecords(snapshot, collectionId).find((record) => record.id === id)
}

export function recordCount(snapshot: CmsSnapshot, collectionId: string): number {
  return selectRecords(snapshot, collectionId).length
}

/* ------------------------------- Blanks -------------------------------- */

export function createBlank(snapshot: CmsSnapshot, collectionId: string): AdminRecord {
  const vl = snapshot.valueLists
  const id = crypto.randomUUID()
  switch (collectionId) {
    case 'products': {
      const product: Product = {
        id,
        slug: '',
        title: 'New product',
        shortDescription: '',
        fullDescription: '',
        priceZar: 0,
        grade: vl.grades[0],
        term: vl.terms[0],
        year: vl.years[0] ?? '2026',
        productKind: 'Single',
        resourceFormat: vl.resourceFormats[0],
        subjects: [],
        marks: null,
        purchasedFiles: [],
        featured: false,
        published: false,
        sortOrder: snapshot.products.length + 1,
        seo: { title: '', description: '' },
        faqs: [],
        updatedAt: '',
      }
      return product as unknown as AdminRecord
    }
    case 'subjects': {
      const subject: Subject = {
        id,
        slug: '',
        name: 'New subject',
        shortLabel: '',
        description: '',
        sortOrder: snapshot.subjects.length + 1,
        visible: true,
        faqs: [],
      }
      return subject as unknown as AdminRecord
    }
    case 'faqs': {
      const faq: Faq = {
        id,
        question: 'New question',
        answer: '',
        category: 'General',
        sortOrder: snapshot.faqs.length + 1,
        published: true,
      }
      return faq as unknown as AdminRecord
    }
    case 'testimonials': {
      const testimonial: Testimonial = {
        id,
        customerName: 'New testimonial',
        quote: '',
        context: '',
        learnerGrade: null,
        sourceDate: '2026-01-01',
        featured: false,
        sortOrder: snapshot.testimonials.length + 1,
        published: true,
      }
      return testimonial as unknown as AdminRecord
    }
    default:
      throw new Error(`Collection "${collectionId}" cannot create records.`)
  }
}

/* -------------------------------- Filters ------------------------------ */

function deriveOptions(records: AdminRecord[], key: string): FieldOption[] {
  const values = new Set<string>()
  for (const record of records) {
    const value = String(getPath(record, key) ?? '').trim()
    if (value) values.add(value)
  }
  return Array.from(values)
    .sort()
    .map((value) => ({ label: value, value }))
}

/** Resolve a collection's filter facets: fixed options, a Value List, or distinct record values. */
export function resolveFilterFacets(
  collection: AdminCollection,
  snapshot: CmsSnapshot,
  records: AdminRecord[],
): { key: string; label: string; options: FieldOption[] }[] {
  return (collection.filters ?? []).map((filter) => ({
    key: filter.key,
    label: filter.label,
    options:
      filter.options ??
      (filter.valueList
        ? snapshot.valueLists[filter.valueList].map((value) => ({ label: value, value }))
        : deriveOptions(records, filter.key)),
  }))
}

/* ---------------------------- Field context ---------------------------- */

export function buildFieldContext(snapshot: CmsSnapshot): FieldContext {
  const toOptions = (values: readonly string[]) => values.map((value) => ({ label: value, value }))
  return {
    valueLists: snapshot.valueLists,
    optionsForSelect: (field: SelectField) =>
      'valueList' in field ? toOptions(snapshot.valueLists[field.valueList]) : field.options,
    optionsForReference: (field: ReferenceField) => {
      if ('valueList' in field) return toOptions(snapshot.valueLists[field.valueList])
      switch (field.collection) {
        case 'subjects':
          return snapshot.subjects.map((s) => ({ label: s.name, value: s.slug }))
        case 'faqs':
          return snapshot.faqs.map((f) => ({ label: f.question, value: f.id }))
        case 'products':
          return snapshot.products
            .filter((p) => (field.filter ? field.filter(p as unknown as AdminRecord) : true))
            .map((p) => ({ label: p.title, value: p.slug }))
        default:
          return []
      }
    },
  }
}

/* -------------------------------- Writes ------------------------------- */

export type SaveResult = { saved: AdminRecord; apply: (snapshot: CmsSnapshot) => CmsSnapshot }

export type AdminAdapter = {
  canWrite: boolean
  save: (collectionId: string, record: AdminRecord) => Promise<SaveResult>
  uploadFile: (record: AdminRecord, file: File) => Promise<ProductFile>
}

export function createAdminAdapter(repository: CmsRepository): AdminAdapter {
  return {
    canWrite: repository.canWrite,

    async save(collectionId, record) {
      switch (collectionId) {
        case 'products': {
          const saved = await repository.saveProduct(record as unknown as Product)
          return { saved: saved as unknown as AdminRecord, apply: (s) => updateProductInSnapshot(s, saved) }
        }
        case 'subjects': {
          const saved = await repository.saveSubject(record as unknown as Subject)
          return { saved: saved as unknown as AdminRecord, apply: (s) => updateSubjectInSnapshot(s, saved) }
        }
        case 'faqs': {
          const saved = await repository.saveFaq(record as unknown as Faq)
          return { saved: saved as unknown as AdminRecord, apply: (s) => updateFaqInSnapshot(s, saved) }
        }
        case 'testimonials': {
          const saved = await repository.saveTestimonial(record as unknown as Testimonial)
          return { saved: saved as unknown as AdminRecord, apply: (s) => updateTestimonialInSnapshot(s, saved) }
        }
        default:
          throw new Error(`Collection "${collectionId}" is read-only.`)
      }
    },

    async uploadFile(record, file) {
      const fileId = `f-${Date.now()}`
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Admin session required.')
      const response = await fetch(apiUrl('/api/admin/upload-url'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: record.id, fileId, filename: file.name }),
      })
      const body = (await response.json()) as { uploadUrl?: string; storageKey?: string; error?: string }
      if (!response.ok || !body.uploadUrl || !body.storageKey) throw new Error(body.error ?? 'Unable to create upload URL.')
      const upload = await fetch(body.uploadUrl, { method: 'PUT', body: file })
      if (!upload.ok) throw new Error('Unable to upload file.')
      return { id: fileId, label: file.name, filename: file.name, storageKey: body.storageKey }
    },
  }
}
