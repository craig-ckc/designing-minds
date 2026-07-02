/* -------------------------------------------------------------------------
   Collection Registry — the single source of truth for the admin workspace.

   Each AdminCollection describes a Supabase-backed Collection as Fields +
   sections + list columns. One generic workspace (screens/AdminWorkspace)
   renders all of them; adding a collection means adding an entry here, not
   writing a new page. Vocabulary follows CONTEXT.md: Collection, Field,
   Reference Field, Value List.
   ------------------------------------------------------------------------- */

import type { AdminCollection, AdminRecord, FieldOption } from './types'

const PUBLISH_LABELS = { on: 'Published', off: 'Draft', verbOn: 'Publish', verbOff: 'Unpublish' }
const VISIBLE_LABELS = { on: 'Visible', off: 'Hidden', verbOn: 'Show', verbOff: 'Hide' }

const boolOptions = (on: string, off: string): FieldOption[] => [
  { label: on, value: 'true' },
  { label: off, value: 'false' },
]
const literalOptions = (values: string[]): FieldOption[] => values.map((value) => ({ label: value, value }))

const isKind = (kind: string) => (record: AdminRecord) => record.productKind === kind
const isIndividualResource = (option: AdminRecord) =>
  (option as { productKind?: string }).productKind === 'Individual Resource'

/* --------------------------------- Products ---------------------------- */

const products: AdminCollection = {
  id: 'products',
  label: 'Products',
  singular: 'Product',
  group: 'Catalogue',
  titleField: 'title',
  subtitleField: 'productKind',
  statusField: 'published',
  statusLabels: PUBLISH_LABELS,
  searchFields: ['title', 'slug', 'grade', 'term', 'resourceFormat'],
  filters: [
    { key: 'productKind', label: 'Kind', valueList: 'productKinds' },
    { key: 'grade', label: 'Grade', valueList: 'grades' },
    { key: 'term', label: 'Term', valueList: 'terms' },
    { key: 'resourceFormat', label: 'Format', valueList: 'resourceFormats' },
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Draft') },
  ],
  fields: [
    { key: 'title', label: 'Name', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'slug', required: true, urlPrefix: 'www.designingminds.co.za/product/' },
    { key: 'shortDescription', label: 'Short description', type: 'textarea' },
    { key: 'fullDescription', label: 'Full description', type: 'richText', helpText: 'Rich text, stored as Markdown and rendered on the product page.' },

    { key: 'priceZar', label: 'Price (ZAR)', type: 'number' },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'published', label: 'Published', type: 'boolean' },
    { key: 'featured', label: 'Featured', type: 'boolean' },

    { key: 'productKind', label: 'Product kind', type: 'select', valueList: 'productKinds', required: true },
    { key: 'resourceFormat', label: 'Resource format', type: 'select', valueList: 'resourceFormats', required: true },
    { key: 'grade', label: 'Grade', type: 'select', valueList: 'grades', required: true },
    { key: 'term', label: 'Term', type: 'select', valueList: 'terms', required: true },
    { key: 'year', label: 'Year', type: 'select', valueList: 'years', required: true },
    { key: 'marks', label: 'Marks', type: 'number', nullable: true },
    {
      key: 'subjects',
      label: 'Subjects (at least one)',
      type: 'multiReference',
      collection: 'subjects',
      valueKey: 'slug',
      required: true,
    },

    { key: 'bundleScope', label: 'Bundle scope', type: 'select', options: [
      { label: 'Term', value: 'Term' },
      { label: 'Full Year', value: 'Full Year' },
    ] },

    { key: 'accessPeriod', label: 'Access period', type: 'select', options: [
      { label: 'Term', value: 'Term' },
      { label: 'Year', value: 'Year' },
    ] },
    { key: 'includedGrades', label: 'Included grades', type: 'multiReference', valueList: 'grades' },
    { key: 'deliveryRules', label: 'Delivery rules', type: 'textarea' },
    { key: 'renewalNotes', label: 'Renewal / expiry notes', type: 'textarea' },

    {
      key: 'includedProductSlugs',
      label: 'Included products (Individual Resources)',
      type: 'multiReference',
      collection: 'products',
      valueKey: 'slug',
      filter: isIndividualResource,
    },
    { key: 'includedSubjects', label: 'Included subjects', type: 'multiReference', collection: 'subjects', valueKey: 'slug' },
    { key: 'includedTerms', label: 'Included terms', type: 'multiReference', valueList: 'terms' },

    { key: 'purchasedFiles', label: 'Purchased files', type: 'fileList' },

    { key: 'faqs', label: 'FAQs referenced by this product', type: 'multiReference', collection: 'faqs', valueKey: 'id' },

    { key: 'seo.title', label: 'Meta title', type: 'text' },
    { key: 'seo.description', label: 'Meta description', type: 'textarea' },
  ],
  sections: [
    { title: 'Basic info', fields: ['title', 'slug', 'shortDescription', 'fullDescription'] },
    { title: 'Pricing & visibility', fields: ['priceZar', 'sortOrder', 'published', 'featured'] },
    { title: 'Classification', fields: ['productKind', 'resourceFormat', 'grade', 'term', 'year', 'marks', 'subjects'] },
    {
      title: 'Bundle details',
      visibleWhen: isKind('Bundle'),
      hint: 'Shown because the product kind is Bundle.',
      fields: ['bundleScope', 'includedProductSlugs', 'includedSubjects', 'includedTerms'],
    },
    {
      title: 'Access plan details',
      visibleWhen: isKind('Access Plan'),
      hint: 'Shown because the product kind is Access Plan.',
      fields: ['accessPeriod', 'includedGrades', 'includedSubjects', 'includedTerms', 'includedProductSlugs', 'deliveryRules', 'renewalNotes'],
    },
    {
      title: 'Files',
      visibleWhen: isKind('Individual Resource'),
      hint: 'Files buyers receive after purchasing this resource.',
      fields: ['purchasedFiles'],
    },
    { title: 'Related FAQs', fields: ['faqs'] },
    { title: 'SEO', fields: ['seo.title', 'seo.description'] },
  ],
  listColumns: [
    { key: 'title', label: 'Title', width: 'minmax(220px, 1.6fr)' },
    { key: 'productKind', label: 'Kind', width: '150px', valueType: 'kind' },
    { key: 'grade', label: 'Grade', width: '110px' },
    { key: 'term', label: 'Term', width: '110px' },
    { key: 'resourceFormat', label: 'Format', width: '160px' },
    { key: 'priceZar', label: 'Price', width: '120px', align: 'right', valueType: 'currency' },
    { key: 'published', label: 'Status', width: '170px', valueType: 'publish' },
  ],
}

/* --------------------------------- Subjects ---------------------------- */

const subjects: AdminCollection = {
  id: 'subjects',
  label: 'Subjects',
  singular: 'Subject',
  group: 'Catalogue',
  titleField: 'name',
  subtitleField: 'slug',
  statusField: 'visible',
  statusLabels: VISIBLE_LABELS,
  searchFields: ['name', 'slug', 'shortLabel'],
  filters: [{ key: 'visible', label: 'Visibility', options: boolOptions('Visible', 'Hidden') }],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'shortLabel', label: 'Short label', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'slug', required: true },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'visible', label: 'Visible on the website', type: 'boolean' },
    { key: 'faqs', label: 'Related FAQs', type: 'multiReference', collection: 'faqs', valueKey: 'id' },
  ],
  sections: [
    { title: 'Details', fields: ['name', 'shortLabel', 'slug', 'sortOrder', 'description', 'visible'] },
    { title: 'Related FAQs', fields: ['faqs'] },
  ],
  listColumns: [
    { key: 'name', label: 'Name', width: 'minmax(200px, 1.4fr)' },
    { key: 'slug', label: 'Slug', width: '180px' },
    { key: 'shortLabel', label: 'Short label', width: '180px' },
    { key: 'sortOrder', label: 'Order', width: '90px' },
    { key: 'visible', label: 'Visibility', width: '140px', valueType: 'visibility' },
  ],
}

/* ----------------------------------- FAQs ------------------------------ */

const faqs: AdminCollection = {
  id: 'faqs',
  label: 'FAQs',
  singular: 'FAQ',
  group: 'Catalogue',
  titleField: 'question',
  subtitleField: 'category',
  statusField: 'published',
  statusLabels: PUBLISH_LABELS,
  searchFields: ['question', 'category'],
  filters: [
    { key: 'category', label: 'Category' },
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Draft') },
  ],
  fields: [
    { key: 'question', label: 'Question', type: 'text', required: true },
    { key: 'answer', label: 'Answer', type: 'textarea', required: true },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'published', label: 'Published', type: 'boolean' },
  ],
  sections: [{ title: 'Details', fields: ['question', 'answer', 'category', 'sortOrder', 'published'] }],
  listColumns: [
    { key: 'question', label: 'Question', width: 'minmax(280px, 2fr)' },
    { key: 'category', label: 'Category', width: '160px' },
    { key: 'sortOrder', label: 'Order', width: '90px' },
    { key: 'published', label: 'Status', width: '140px', valueType: 'publish' },
  ],
}

/* ------------------------------- Testimonials -------------------------- */

const testimonials: AdminCollection = {
  id: 'testimonials',
  label: 'Testimonials',
  singular: 'Testimonial',
  group: 'Catalogue',
  titleField: 'customerName',
  subtitleField: 'context',
  statusField: 'published',
  statusLabels: PUBLISH_LABELS,
  searchFields: ['customerName', 'quote', 'context'],
  filters: [
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Draft') },
    { key: 'featured', label: 'Featured', options: boolOptions('Featured', 'Not featured') },
    { key: 'learnerGrade', label: 'Grade', valueList: 'grades' },
  ],
  fields: [
    { key: 'customerName', label: 'Customer display name', type: 'text', required: true },
    { key: 'quote', label: 'Quote', type: 'textarea', required: true },
    { key: 'context', label: 'Context / result', type: 'text' },
    { key: 'learnerGrade', label: 'Learner grade', type: 'select', valueList: 'grades', allowEmpty: true, emptyLabel: 'Not specified', emptyValue: null },
    { key: 'sourceDate', label: 'Source date', type: 'date' },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'published', label: 'Published', type: 'boolean' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
  ],
  sections: [
    { title: 'Details', fields: ['customerName', 'quote', 'context', 'learnerGrade', 'sourceDate', 'sortOrder', 'published', 'featured'] },
  ],
  listColumns: [
    { key: 'customerName', label: 'Customer', width: 'minmax(180px, 1fr)' },
    { key: 'quote', label: 'Quote', width: 'minmax(240px, 2fr)' },
    { key: 'learnerGrade', label: 'Grade', width: '110px' },
    { key: 'published', label: 'Status', width: '170px', valueType: 'publish' },
  ],
}

/* ------------------------------ Operations ----------------------------- */
/* Read-only collections. The adapter maps each operational domain record to a
   display-ready AdminRecord (see cms/adapter.ts). */

const orders: AdminCollection = {
  id: 'orders',
  label: 'Orders',
  singular: 'Order',
  group: 'Operations',
  titleField: 'reference',
  subtitleField: 'customerName',
  readOnly: true,
  searchFields: ['reference', 'customerName', 'customerEmail'],
  filters: [{ key: 'status', label: 'Status', options: literalOptions(['pending', 'paid', 'fulfilled', 'refunded', 'failed']) }],
  fields: [
    { key: 'reference', label: 'Reference', type: 'readonly' },
    { key: 'status', label: 'Status', type: 'readonly' },
    { key: 'date', label: 'Placed', type: 'readonly' },
    { key: 'customerName', label: 'Customer', type: 'readonly' },
    { key: 'customerEmail', label: 'Email', type: 'readonly' },
    { key: 'totalLabel', label: 'Total', type: 'readonly' },
    { key: 'itemsSummary', label: 'Items', type: 'readonly' },
    { key: 'paymentSummary', label: 'Payment', type: 'readonly' },
  ],
  sections: [
    { title: 'Order', fields: ['reference', 'status', 'date', 'customerName', 'customerEmail', 'totalLabel'] },
    { title: 'Items', fields: ['itemsSummary'] },
    { title: 'Payment', fields: ['paymentSummary'] },
  ],
  listColumns: [
    { key: 'reference', label: 'Reference', width: 'minmax(140px, 1fr)' },
    { key: 'customerName', label: 'Customer', width: 'minmax(200px, 1.4fr)' },
    { key: 'date', label: 'Date', width: '120px' },
    { key: 'itemCount', label: 'Items', width: '80px' },
    { key: 'status', label: 'Status', width: '130px', valueType: 'orderStatus' },
    { key: 'total', label: 'Total', width: '120px', align: 'right', valueType: 'currency' },
  ],
}

const customers: AdminCollection = {
  id: 'customers',
  label: 'Customers',
  singular: 'Customer',
  group: 'Operations',
  titleField: 'name',
  subtitleField: 'email',
  readOnly: true,
  searchFields: ['name', 'email'],
  fields: [
    { key: 'name', label: 'Name', type: 'readonly' },
    { key: 'email', label: 'Email', type: 'readonly' },
    { key: 'joined', label: 'Joined', type: 'readonly' },
    { key: 'orderCount', label: 'Orders', type: 'readonly' },
    { key: 'ltvLabel', label: 'Lifetime value', type: 'readonly' },
  ],
  sections: [{ title: 'Account', fields: ['name', 'email', 'joined', 'orderCount', 'ltvLabel'] }],
  listColumns: [
    { key: 'name', label: 'Name', width: 'minmax(200px, 1.4fr)' },
    { key: 'email', label: 'Email', width: 'minmax(240px, 2fr)' },
    { key: 'joined', label: 'Joined', width: '120px' },
    { key: 'orderCount', label: 'Orders', width: '90px' },
    { key: 'ltv', label: 'Lifetime value', width: '150px', align: 'right', valueType: 'currency' },
  ],
}

const payments: AdminCollection = {
  id: 'payments',
  label: 'Payments',
  singular: 'Payment',
  group: 'Operations',
  titleField: 'reference',
  subtitleField: 'provider',
  readOnly: true,
  searchFields: ['reference', 'orderReference', 'provider'],
  filters: [
    { key: 'status', label: 'Status', options: literalOptions(['pending', 'succeeded', 'failed', 'refunded']) },
    { key: 'provider', label: 'Provider' },
  ],
  fields: [
    { key: 'reference', label: 'Reference', type: 'readonly' },
    { key: 'orderReference', label: 'Order', type: 'readonly' },
    { key: 'provider', label: 'Provider', type: 'readonly' },
    { key: 'date', label: 'Created', type: 'readonly' },
    { key: 'status', label: 'Status', type: 'readonly' },
    { key: 'amountLabel', label: 'Amount', type: 'readonly' },
  ],
  sections: [{ title: 'Payment', fields: ['reference', 'orderReference', 'provider', 'date', 'status', 'amountLabel'] }],
  listColumns: [
    { key: 'reference', label: 'Reference', width: 'minmax(160px, 1fr)' },
    { key: 'orderReference', label: 'Order', width: 'minmax(160px, 1.2fr)' },
    { key: 'provider', label: 'Provider', width: '140px' },
    { key: 'date', label: 'Date', width: '120px' },
    { key: 'status', label: 'Status', width: '120px', valueType: 'paymentStatus' },
    { key: 'amount', label: 'Amount', width: '130px', align: 'right', valueType: 'currency' },
  ],
}

export const collectionRegistry: AdminCollection[] = [
  products,
  subjects,
  faqs,
  testimonials,
  orders,
  customers,
  payments,
]

export function getCollection(id: string | undefined): AdminCollection | undefined {
  return collectionRegistry.find((collection) => collection.id === id)
}

export type CollectionGroup = { group: string; collections: AdminCollection[] }

export const collectionGroups: CollectionGroup[] = collectionRegistry.reduce<CollectionGroup[]>((groups, collection) => {
  const existing = groups.find((entry) => entry.group === collection.group)
  if (existing) existing.collections.push(collection)
  else groups.push({ group: collection.group, collections: [collection] })
  return groups
}, [])
