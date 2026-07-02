/* -------------------------------------------------------------------------
   CMS workspace config model.

   Mirrors the Three Acts CMS mental model (apps/cms): a single Collection
   Registry describes every editable Collection as a set of Fields + list
   columns, and one generic FieldControl/RecordEditor renders any of them.

   Adapted for Designing Minds: a record is the existing typed domain object
   (Product / Subject / …) addressed by field.key — not a generic values bag —
   so the typed @designing-minds/cms repository and its snapshot mutators are
   reused unchanged. See cms/adapter.ts.
   ------------------------------------------------------------------------- */

import type { ValueLists } from '@designing-minds/cms'

/** A CMS record as the workspace sees it: a plain object keyed by field.key. */
export type AdminRecord = Record<string, unknown> & { id: string }

/** Sidebar grouping for collections. */
export type CollectionGroupName = 'Catalogue' | 'Operations'

/* --------------------------------- Fields ------------------------------ */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richText'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'readonly'
  | 'slug'
  | 'select'
  | 'reference'
  | 'multiReference'
  | 'fileList'

/** Collections that a Reference Field can point at. */
export type ReferenceCollection = 'subjects' | 'faqs' | 'products'

/** Where a select's options come from: a static list or a Value List. */
export type SelectSource =
  | { options: { label: string; value: string }[] }
  | { valueList: keyof ValueLists }

/** Where a Reference Field's options come from: another Collection or a Value List. */
export type ReferenceSource =
  | { collection: ReferenceCollection; valueKey: 'slug' | 'id'; filter?: (option: AdminRecord) => boolean }
  | { valueList: keyof ValueLists }

type FieldBase = {
  /** Dotted keys (e.g. `seo.title`) are supported for nested values. */
  key: string
  label: string
  required?: boolean
  helpText?: string
  /** Hide the field unless the predicate passes (conditional fields/sections). */
  visibleWhen?: (record: AdminRecord) => boolean
}

export type PrimitiveField = FieldBase & {
  /** richText edits as WYSIWYG but stores a Markdown string. */
  type: 'text' | 'textarea' | 'richText' | 'number' | 'boolean' | 'date' | 'datetime' | 'readonly'
  /** number only: an empty input stores null instead of 0 (e.g. marks). */
  nullable?: boolean
}

export type SlugField = FieldBase & {
  type: 'slug'
  /** Shown under the input as a live URL preview, e.g. `www.designingminds.co.za/product/`. */
  urlPrefix?: string
}

/** Optional "no value" choice for non-required selects (e.g. learner grade). */
type SelectExtras = { allowEmpty?: boolean; emptyLabel?: string; emptyValue?: string | null }

export type SelectField = FieldBase & { type: 'select' } & SelectSource & SelectExtras

export type ReferenceField = FieldBase & { type: 'reference' | 'multiReference' } & ReferenceSource

export type FileListField = FieldBase & { type: 'fileList' }

export type AdminField = PrimitiveField | SlugField | SelectField | ReferenceField | FileListField

/* ------------------------------ List columns --------------------------- */

export type ListValueType =
  | 'text'
  | 'currency'
  | 'date'
  | 'kind'
  | 'publish'
  | 'visibility'
  | 'orderStatus'
  | 'paymentStatus'
  | 'count'

export type ListColumn = {
  key: string
  label: string
  /** CSS grid track, e.g. `minmax(220px, 1.4fr)` or `140px`. Defaults to `1fr`. */
  width?: string
  align?: 'left' | 'right'
  valueType?: ListValueType
}

/* -------------------------------- Filters ------------------------------ */

/**
 * A facet in the list Filter popover. Values within a facet are OR-ed;
 * facets are AND-ed. Record values are matched by `String(value)`, so boolean
 * facets use 'true'/'false' option values.
 */
export type CollectionFilter = {
  /** Record key the facet filters on (dotted keys supported). */
  key: string
  label: string
  /** Fixed options (e.g. Published/Draft for booleans). */
  options?: FieldOption[]
  /** Options from a Value List. */
  valueList?: keyof ValueLists
  /* When neither is given, distinct values are derived from the records. */
}

/* ------------------------------ Collections ---------------------------- */

export type EditorSection = {
  title: string
  /** Field keys, in render order. */
  fields: string[]
  visibleWhen?: (record: AdminRecord) => boolean
  /** Short explanation under the title (e.g. why a conditional section is showing). */
  hint?: string
}

export type AdminCollection = {
  id: string
  label: string
  /** Singular noun for "New …" actions and messages. */
  singular: string
  group: CollectionGroupName
  /** Field key used as the record's primary label. */
  titleField: string
  /** Field key shown as the secondary label in the record list pane. */
  subtitleField?: string
  /** Boolean field that drives the Published/Draft (or Visible/Hidden) status. */
  statusField?: string
  /** Two-state status vocabulary for the header pill + toggle. */
  statusLabels?: { on: string; off: string; verbOn: string; verbOff: string }
  /** Read-only collections (operations) have no create/save/upload. */
  readOnly?: boolean
  /** Field keys searched by the toolbar search box. */
  searchFields: string[]
  /** Facets offered by the list Filter popover. */
  filters?: CollectionFilter[]
  fields: AdminField[]
  sections: EditorSection[]
  listColumns: ListColumn[]
}

/* ----------------------------- Field context --------------------------- */

export type FieldOption = { label: string; value: string }

/** Runtime data the generic FieldControl needs to resolve dynamic options. */
export type FieldContext = {
  valueLists: ValueLists
  optionsForSelect: (field: SelectField) => FieldOption[]
  optionsForReference: (field: ReferenceField) => FieldOption[]
}
