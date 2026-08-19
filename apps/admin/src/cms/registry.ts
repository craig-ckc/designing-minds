/* -------------------------------------------------------------------------
   Collection Registry — the single source of truth for the admin workspace.

   Each AdminCollection describes a Supabase-backed Collection as Fields +
   sections + list columns. One generic workspace (screens/AdminWorkspace)
   renders all of them; adding a collection means adding an entry here, not
   writing a new page. Vocabulary follows CONTEXT.md: Collection, Field,
   Reference Field, Value List.
   ------------------------------------------------------------------------- */

import type { AdminCollection, FieldOption } from './types'

/**
 * Status vocabulary for the header control.
 *
 * `off` is "Unpublished", NOT "Draft": Draft is the derived state of a
 * published record whose saved changes the site hasn't picked up yet, so using
 * it for the off-state would make two different things share one word.
 */
const PUBLISH_LABELS = { on: 'Published', off: 'Unpublished', verbOn: 'Publish', verbOff: 'Unpublish' }

const boolOptions = (on: string, off: string): FieldOption[] => [
  { label: on, value: 'true' },
  { label: off, value: 'false' },
]
const literalOptions = (values: string[]): FieldOption[] => values.map((value) => ({ label: value, value }))

/* --------------------------------- Products ---------------------------- */

const products: AdminCollection = {
  id: 'products',
  label: 'Products',
  singular: 'Product',
  group: 'Catalogue',
  titleField: 'title',
  subtitleField: 'resourceFormat',
  statusField: 'published',
  statusLabels: PUBLISH_LABELS,
  searchFields: ['title', 'slug', 'grade', 'term', 'resourceFormat'],
  filters: [
    { key: 'grade', label: 'Grade', valueList: 'grades' },
    { key: 'term', label: 'Term', valueList: 'terms' },
    { key: 'resourceFormat', label: 'Format', valueList: 'resourceFormats' },
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Unpublished') },
  ],
  fields: [
    { key: 'title', label: 'Name', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'slug', required: true, urlPrefix: 'www.designingminds.co.za/shop/' },
    { key: 'shortDescription', label: 'Short description', type: 'textarea' },
    { key: 'fullDescription', label: 'Full description', type: 'richText', helpText: 'Rich text, stored as Markdown and rendered on the product page.' },

    { key: 'priceZar', label: 'Price (ZAR)', type: 'number' },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'published', label: 'Published', type: 'boolean' },
    { key: 'featured', label: 'Featured', type: 'boolean' },

    { key: 'resourceFormat', label: 'Resource format', type: 'select', valueList: 'resourceFormats', required: true },
    { key: 'grade', label: 'Grade', type: 'select', valueList: 'grades', required: true },
    { key: 'term', label: 'Term', type: 'select', valueList: 'terms', required: true },
    { key: 'year', label: 'Year', type: 'select', valueList: 'years', required: true },
    { key: 'marks', label: 'Marks', type: 'number', nullable: true },
    { key: 'subjects', label: 'Subject', type: 'multiReference', valueList: 'subjects', required: true, maxSelected: 1 },

    { key: 'purchasedFiles', label: 'Purchased files', type: 'fileList' },
    { key: 'galleryImages', label: 'Preview images', type: 'imageGallery' },

    { key: 'faqs', label: 'FAQs referenced by this product', type: 'multiReference', collection: 'faqs', valueKey: 'id' },

    { key: 'seo.title', label: 'Meta title', type: 'text' },
    { key: 'seo.description', label: 'Meta description', type: 'textarea' },
  ],
  sections: [
    { title: 'Basic info', fields: ['title', 'slug', 'shortDescription', 'fullDescription'] },
    /* `published` is deliberately absent from every section below: the editor
       header owns it via the status menu. It stays in `fields` because filters
       and CSV import/export still address it by key. */
    { title: 'Pricing & visibility', fields: ['priceZar', 'sortOrder', 'featured'] },
    { title: 'Classification', fields: ['resourceFormat', 'grade', 'term', 'year', 'marks', 'subjects'] },
    {
      title: 'Files',
      hint: 'Files buyers receive after purchasing this resource.',
      fields: ['purchasedFiles'],
    },
    {
      title: 'Preview images',
      hint: 'Shown to anyone browsing, after the generated cover. Drag in as many as you like — the first one here is the second thing a shopper sees.',
      fields: ['galleryImages'],
    },
    { title: 'Related FAQs', fields: ['faqs'] },
    { title: 'SEO', fields: ['seo.title', 'seo.description'] },
  ],
  listColumns: [
    { key: 'title', label: 'Title', width: 'minmax(220px, 1.6fr)' },
    { key: 'grade', label: 'Grade', width: '110px' },
    { key: 'term', label: 'Term', width: '110px' },
    { key: 'resourceFormat', label: 'Format', width: '160px' },
    { key: 'priceZar', label: 'Price', width: '120px', align: 'right', valueType: 'currency' },
    { key: 'updatedAt', label: 'Published', width: '150px', valueType: 'publishedAt' },
    { key: 'published', label: 'Status', width: '170px', valueType: 'publish' },
  ],
}

/* --------------------------------- Bundles ------------------------------
   A bundle is a priced package of individual resources. Its contents are the
   `includedProductIds` multi-reference and nothing else — there are no
   subject/term rules any more, so what an editor picks here is exactly what a
   buyer gets. Subjects, terms and monetary value are derived from the members
   by the website (see bundleValue), so they are not fields. */

const bundles: AdminCollection = {
  id: 'bundles',
  label: 'Bundles',
  singular: 'Bundle',
  group: 'Catalogue',
  titleField: 'title',
  subtitleField: 'bundleScope',
  statusField: 'published',
  statusLabels: PUBLISH_LABELS,
  searchFields: ['title', 'slug', 'grade', 'term'],
  filters: [
    { key: 'grade', label: 'Grade', valueList: 'grades' },
    { key: 'term', label: 'Term', valueList: 'terms' },
    {
      key: 'bundleScope',
      label: 'Scope',
      options: [
        { label: 'Term', value: 'Term' },
        { label: 'Full Year', value: 'Full Year' },
      ],
    },
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Unpublished') },
  ],
  fields: [
    { key: 'title', label: 'Name', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'slug', required: true, urlPrefix: 'www.designingminds.co.za/shop/' },
    { key: 'shortDescription', label: 'Short description', type: 'textarea' },
    { key: 'fullDescription', label: 'Full description', type: 'richText', helpText: 'Rich text, stored as Markdown and rendered on the bundle page.' },

    { key: 'priceZar', label: 'Price (ZAR)', type: 'number' },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'featured', label: 'Featured', type: 'boolean' },

    {
      key: 'bundleScope',
      label: 'Scope',
      type: 'select',
      options: [
        { label: 'Term', value: 'Term' },
        { label: 'Full Year', value: 'Full Year' },
      ],
    },
    { key: 'grade', label: 'Grade', type: 'select', valueList: 'grades', required: true },
    { key: 'term', label: 'Term', type: 'select', valueList: 'terms', required: true },
    { key: 'year', label: 'Year', type: 'select', valueList: 'years', required: true },

    {
      key: 'includedProductIds',
      label: 'Included resources',
      type: 'multiReference',
      collection: 'products',
      valueKey: 'id',
      required: true,
      helpText: 'Exactly what a buyer receives. Price saving, subjects and terms are worked out from these.',
    },

    { key: 'galleryImages', label: 'Preview images', type: 'imageGallery' },

    { key: 'faqs', label: 'FAQs referenced by this bundle', type: 'multiReference', collection: 'faqs', valueKey: 'id' },

    { key: 'seo.title', label: 'Meta title', type: 'text' },
    { key: 'seo.description', label: 'Meta description', type: 'textarea' },
  ],
  sections: [
    { title: 'Basic info', fields: ['title', 'slug', 'shortDescription', 'fullDescription'] },
    { title: 'Pricing & visibility', fields: ['priceZar', 'sortOrder', 'featured'] },
    { title: 'Classification', fields: ['bundleScope', 'grade', 'term', 'year'] },
    { title: 'Contents', hint: 'The resources this bundle unlocks.', fields: ['includedProductIds'] },
    {
      title: 'Preview images',
      hint: 'Shown to anyone browsing, after the generated cover stack. Drag in as many as you like — the first one here is the second thing a shopper sees.',
      fields: ['galleryImages'],
    },
    { title: 'Related FAQs', fields: ['faqs'] },
    { title: 'SEO', fields: ['seo.title', 'seo.description'] },
  ],
  listColumns: [
    { key: 'title', label: 'Title', width: 'minmax(220px, 1.6fr)' },
    { key: 'bundleScope', label: 'Scope', width: '130px' },
    { key: 'grade', label: 'Grade', width: '110px' },
    { key: 'term', label: 'Term', width: '110px' },
    { key: 'includedProductIds', label: 'Items', width: '90px', valueType: 'count' },
    { key: 'priceZar', label: 'Price', width: '120px', align: 'right', valueType: 'currency' },
    { key: 'updatedAt', label: 'Published', width: '150px', valueType: 'publishedAt' },
    { key: 'published', label: 'Status', width: '170px', valueType: 'publish' },
  ],
}

/* --------------------------------- Subjects ----------------------------
   Subjects are a Value List (value_lists.subjects), not a Collection. The
   product editor picks them via the `subjects` / `includedSubjects`
   multiReference fields above (valueList: 'subjects'). Edit the list of
   subjects directly in the database, like grades and terms. */

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
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Unpublished') },
  ],
  fields: [
    { key: 'question', label: 'Question', type: 'text', required: true },
    { key: 'answer', label: 'Answer', type: 'textarea', required: true },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'sortOrder', label: 'Sort order', type: 'number' },
    { key: 'published', label: 'Published', type: 'boolean' },
  ],
  sections: [{ title: 'Details', fields: ['question', 'answer', 'category', 'sortOrder'] }],
  listColumns: [
    { key: 'question', label: 'Question', width: 'minmax(280px, 2fr)' },
    { key: 'category', label: 'Category', width: '160px' },
    { key: 'sortOrder', label: 'Order', width: '90px' },
    { key: 'updatedAt', label: 'Published', width: '150px', valueType: 'publishedAt' },
    { key: 'published', label: 'Status', width: '170px', valueType: 'publish' },
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
    { key: 'published', label: 'Status', options: boolOptions('Published', 'Unpublished') },
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
    { title: 'Details', fields: ['customerName', 'quote', 'context', 'learnerGrade', 'sourceDate', 'sortOrder', 'featured'] },
  ],
  listColumns: [
    { key: 'customerName', label: 'Customer', width: 'minmax(180px, 1fr)' },
    { key: 'quote', label: 'Quote', width: 'minmax(240px, 2fr)' },
    { key: 'learnerGrade', label: 'Grade', width: '110px' },
    { key: 'updatedAt', label: 'Published', width: '150px', valueType: 'publishedAt' },
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

/* ----------------------------- Submissions ----------------------------- */
/* Read-only public form submissions. Stable columns show in the list; the
   variable submitted fields render from the JSONB `data` bag via the keyValue
   field, so new form fields appear with no config change. */

const formContact: AdminCollection = {
  id: 'formContact',
  label: 'Contact submissions',
  singular: 'Contact submission',
  group: 'Submissions',
  titleField: 'email',
  subtitleField: 'name',
  readOnly: true,
  searchFields: ['name', 'email'],
  fields: [
    { key: 'name', label: 'Name', type: 'readonly' },
    { key: 'email', label: 'Email', type: 'readonly' },
    { key: 'date', label: 'Received', type: 'readonly' },
    { key: 'sourceUrl', label: 'Submitted from', type: 'readonly' },
    { key: 'data', label: 'Message & fields', type: 'keyValue' },
  ],
  sections: [
    { title: 'Submission', fields: ['name', 'email', 'date', 'sourceUrl'] },
    { title: 'Details', fields: ['data'] },
  ],
  listColumns: [
    { key: 'email', label: 'Email', width: 'minmax(240px, 2fr)' },
    { key: 'name', label: 'Name', width: 'minmax(180px, 1.2fr)' },
    { key: 'date', label: 'Received', width: '130px' },
  ],
}

const formNewsletter: AdminCollection = {
  id: 'formNewsletter',
  label: 'Newsletter signups',
  singular: 'Newsletter signup',
  group: 'Submissions',
  titleField: 'email',
  subtitleField: 'date',
  readOnly: true,
  searchFields: ['email'],
  fields: [
    { key: 'email', label: 'Email', type: 'readonly' },
    { key: 'date', label: 'Signed up', type: 'readonly' },
    { key: 'sourceUrl', label: 'Submitted from', type: 'readonly' },
    { key: 'data', label: 'Fields', type: 'keyValue' },
  ],
  sections: [
    { title: 'Signup', fields: ['email', 'date', 'sourceUrl'] },
    { title: 'Details', fields: ['data'] },
  ],
  listColumns: [
    { key: 'email', label: 'Email', width: 'minmax(260px, 2fr)' },
    { key: 'date', label: 'Signed up', width: '140px' },
  ],
}

export const collectionRegistry: AdminCollection[] = [
  products,
  bundles,
  faqs,
  testimonials,
  orders,
  customers,
  payments,
  formContact,
  formNewsletter,
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
