import { type ReactNode } from 'react'
import { fromJohannesburgInput, toJohannesburgInput } from '@designing-minds/cms'
import type { PreviewPdf, ProductFile, ProductImage } from '@designing-minds/cms'
import type { AdminField, AdminRecord, FieldContext, MultiReferenceField, SelectField, SingleReferenceField } from '../../cms/types'
import { getPath } from '../../cms/record'
import { cn, FIELD_HELP, FIELD_LABEL, SUNK } from '../../design'
import { Icon } from '../ui'
import { Input, ReferencePicker, Select, Switch, Textarea, type SelectOption } from '../primitives'
import { FileListField } from './FileListField'
import { ImageGalleryField } from './ImageGalleryField'
import { PreviewPdfField } from './PreviewPdfField'
import { DeferredRichTextEditor } from './DeferredRichTextEditor'
import { CustomizationRulesField } from './CustomizationRulesField'
import { PhysicalVariantsField } from './PhysicalVariantsField'
import { VariantOptionsField } from './VariantOptionsField'
import { BILLABLE_LETTERS } from '../../cms/physical-product-edit'

type Props = {
  field: AdminField
  record: AdminRecord
  /** Owning collection — file uploads are addressed by collection + record. */
  collectionId: string
  ctx: FieldContext
  onUpdate: (key: string, value: unknown) => void
  disabled?: boolean
}

export function FieldControl({ field, record, collectionId, ctx, onUpdate, disabled }: Props) {
  const value = getPath(record, field.key)
  const inputId = `${record.id}:${field.key}`

  return <FieldShell field={field} inputId={inputId}>{renderControl()}</FieldShell>

  function renderControl(): ReactNode {
    switch (field.type) {
      case 'readonly': {
        const text = value == null || value === '' ? '—' : String(value)
        return <div className={cn(SUNK, 'min-h-field whitespace-pre-line px-2.5 py-1 text-ui text-ink-soft')}>{text}</div>
      }

      /* Renders an object (e.g. a JSONB "data" bag) as read-only label/value
         rows, so new form fields surface automatically with no config change. */
      case 'keyValue': {
        const entries =
          value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value as Record<string, unknown>) : []
        if (entries.length === 0) {
          return <div className={cn(SUNK, 'min-h-field px-2.5 py-1 text-ui text-ink-soft')}>No additional fields.</div>
        }
        return (
          <dl className={cn(SUNK, 'grid gap-2 p-2.5')}>
            {entries.map(([key, entryValue]) => (
              <div key={key} className="grid gap-0.5">
                <dt className="text-meta uppercase text-muted">{key}</dt>
                <dd className="whitespace-pre-wrap text-ui text-ink">
                  {entryValue == null || entryValue === '' ? '—' : String(entryValue)}
                </dd>
              </div>
            ))}
          </dl>
        )
      }

      /* Webflow-style toggle: label above (from FieldShell), switch + On/Off below. */
      case 'boolean': {
        const checked = Boolean(value)
        return (
          <label htmlFor={inputId} className={cn('flex min-h-field w-fit min-w-field items-center gap-2 dense:min-h-0 dense:min-w-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
            <Switch id={inputId} aria-label={field.label} checked={checked} onCheckedChange={(next) => onUpdate(field.key, next)} disabled={disabled} />
            <span aria-hidden className="text-ui text-ink-soft">{checked ? 'On' : 'Off'}</span>
          </label>
        )
      }

      case 'textarea':
        return (
          <Textarea id={inputId} value={String(value ?? '')} disabled={disabled} onChange={(e) => onUpdate(field.key, e.target.value)} />
        )

      case 'richText':
        return (
          <DeferredRichTextEditor
            id={inputId}
            aria-labelledby={`${inputId}:label`}
            value={String(value ?? '')}
            disabled={disabled}
            onChange={(markdown) => onUpdate(field.key, markdown)}
          />
        )

      case 'number':
        return (
          <Input
            id={inputId}
            type="number"
            step={['priceZar', 'salePriceZar', 'value'].includes(field.key) ? '0.01' : '1'}
            value={value === null || value === undefined || value === '' ? '' : Number(value)}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value === '') return onUpdate(field.key, field.nullable ? null : 0)
              onUpdate(field.key, Number(e.target.value))
            }}
          />
        )

      case 'date':
      case 'datetime':
        return (
          <Input
            id={inputId}
            type={field.type === 'date' ? 'date' : 'datetime-local'}
            value={field.timezone ? toJohannesburgInput(value as string | null) : String(value ?? '')}
            disabled={disabled}
            onChange={(e) => onUpdate(field.key, field.timezone ? fromJohannesburgInput(e.target.value) : e.target.value || null)}
          />
        )

      case 'slug':
        return (
          <>
            <Input id={inputId} value={String(value ?? '')} disabled={disabled} onChange={(e) => onUpdate(field.key, e.target.value)} />
            {field.urlPrefix ? (
              <div className={cn(SUNK, 'mt-2 flex items-center gap-2 px-2.5 py-1 text-ui text-ink-soft')}>
                <span className="size-3 flex-none">
                  <Icon name="external" />
                </span>
                <span className="min-w-0 break-all">
                  <span className="text-muted">{field.urlPrefix}</span>
                  <strong className="font-medium text-ink">{String(value || 'your-slug')}</strong>
                </span>
              </div>
            ) : null}
          </>
        )

      case 'select':
        return renderSelect(field)

      case 'reference':
        return renderReferenceSingle(field)

      case 'multiReference':
        return renderMultiReference(field)

      case 'fileList':
        return renderFileList()

      case 'imageGallery':
        return renderImageGallery()

      case 'previewPdfList':
        return renderPreviewPdfList()

      case 'customizationRules':
        return (
          <CustomizationRulesField
            value={value}
            variantOptions={record.variantOptions}
            pricingFieldKey={record.pricingMode === 'per_character' ? (record.pricingFieldKey as string | null) : null}
            billableCharacters={record.billableCharacters as string | null}
            disabled={disabled}
            onChange={(rules) => onUpdate(field.key, rules)}
            onPricingChange={(key, billable) => {
              // "Charge per letter" on a question drives the product's pricing method.
              if (!key) return onUpdate('pricingMode', 'fixed')
              onUpdate('pricingMode', 'per_character')
              onUpdate('pricingFieldKey', key)
              onUpdate('billableCharacters', billable || record.billableCharacters || BILLABLE_LETTERS)
            }}
          />
        )

      case 'variantOptions':
        return <VariantOptionsField value={value} variants={record.variants} disabled={disabled} onChange={(options) => onUpdate(field.key, options)} />

      case 'physicalVariants':
        return <PhysicalVariantsField value={value} options={record.variantOptions} productId={record.id} basePrice={record.priceZar} perLetter={record.pricingMode === 'per_character'} disabled={disabled} onChange={(variants) => onUpdate(field.key, variants)} />

      default:
        return <Input id={inputId} value={String(value ?? '')} disabled={disabled} onChange={(e) => onUpdate(field.key, e.target.value)} />
    }
  }

  function renderSelect(select: SelectField): ReactNode {
    const current = value == null ? '' : String(value)
    const options: SelectOption[] = []
    if (select.allowEmpty) {
      options.push({ label: select.emptyLabel ?? 'Not specified', value: '' })
    } else if (current === '') {
      options.push({ label: 'Select…', value: '' })
    }
    options.push(...ctx.optionsForSelect(select))

    return (
      <Select
        id={inputId}
        value={current}
        disabled={disabled}
        options={options}
        onValueChange={(next) => {
          if (select.allowEmpty && next === '') return onUpdate(field.key, select.emptyValue ?? null)
          onUpdate(field.key, next)
        }}
      />
    )
  }

  function renderReferenceSingle(reference: SingleReferenceField): ReactNode {
    const current = value == null ? '' : String(value)
    const options: SelectOption[] = current === '' ? [{ label: 'Select…', value: '' }] : []
    options.push(...ctx.optionsForReference(reference))
    return <Select id={inputId} value={current} disabled={disabled} options={options} onValueChange={(next) => onUpdate(field.key, next)} />
  }

  function renderMultiReference(reference: MultiReferenceField): ReactNode {
    const options = ctx.optionsForReference(reference)
    const selected = Array.isArray(value) ? (value as string[]) : []

    /* A reference capped at one is a single choice wearing a picker's clothes.
       The type-ahead invites you to keep typing and the chip list invites you
       to keep adding, so the control advertises exactly what `maxSelected: 1`
       forbids — and a product's Subject is the case in point.

       Only the control changes. The column stays `string[]` (Product.subjects
       is an array of display names, required to hold at least one), so this
       reads value[0] and writes a one-item array back. Clearing writes `[]`
       rather than `['']`, which is what the required check looks for. */
    if (reference.maxSelected === 1) {
      const current = selected[0] ?? ''
      // Mirrors renderReferenceSingle: the empty choice only exists until one
      // is made, because these fields are required and there is no going back
      // to "unset" once a value is in.
      const choices: SelectOption[] = current === '' ? [{ label: 'Select…', value: '' }] : []
      choices.push(...options)
      return (
        <Select
          id={inputId}
          value={current}
          disabled={disabled}
          options={choices}
          onValueChange={(next) => onUpdate(field.key, next === '' ? [] : [next])}
        />
      )
    }

    /* Type-ahead picker: type to filter, click to add — scales to large collections. */
    return (
      <ReferencePicker
        id={inputId}
        options={options}
        selected={selected}
        onChange={(next) => onUpdate(field.key, next)}
        disabled={disabled}
        maxSelected={reference.maxSelected}
      />
    )
  }

  function renderImageGallery(): ReactNode {
    const images = Array.isArray(value) ? (value as ProductImage[]) : []
    return (
      <ImageGalleryField
        collectionId={collectionId}
        recordId={record.id}
        fieldKey={field.key}
        images={images}
        onChange={(update) => onUpdate(field.key, update)}
        disabled={disabled}
        labelId={`${inputId}:label`}
      />
    )
  }

  function renderFileList(): ReactNode {
    const files = Array.isArray(value) ? (value as ProductFile[]) : []
    return (
      <FileListField
        collectionId={collectionId}
        recordId={record.id}
        fieldKey={field.key}
        label={field.label}
        files={files}
        onChange={(update) => onUpdate(field.key, update)}
        disabled={disabled}
        labelId={`${inputId}:label`}
      />
    )
  }

  function renderPreviewPdfList(): ReactNode {
    const previews = Array.isArray(value) ? (value as PreviewPdf[]) : []
    return (
      <PreviewPdfField
        collectionId={collectionId}
        recordId={record.id}
        fieldKey={field.key}
        label={field.label}
        previews={previews}
        onChange={(update) => onUpdate(field.key, update)}
        disabled={disabled}
        labelId={`${inputId}:label`}
      />
    )
  }
}

/* A file list, an image gallery, and a preview PDF slot are groups of
   controls, not one input, so their caption is a plain label referenced by
   aria-labelledby rather than a <label htmlFor> pointing at something that
   can't take focus. */
const GROUP_FIELDS = new Set<AdminField['type']>(['fileList', 'imageGallery', 'previewPdfList', 'richText', 'customizationRules', 'physicalVariants', 'variantOptions'])

function FieldShell({ field, inputId, children }: { field: AdminField; inputId: string; children: ReactNode }) {
  const isGroup = GROUP_FIELDS.has(field.type)
  const Caption = isGroup ? 'span' : 'label'
  return (
    <div className="grid gap-2" role={isGroup ? 'group' : undefined} aria-labelledby={isGroup ? `${inputId}:label` : undefined}>
      {/* The label steps down to control size and regular weight, deliberately
          not bold, so the eye goes to the value below it rather than competing
          with it. */}
      <Caption
        id={`${inputId}:label`}
        htmlFor={isGroup ? undefined : inputId}
        className={FIELD_LABEL}
      >
        {field.label}
        {field.required ? <span className="text-danger"> *</span> : null}
      </Caption>
      {children}
      {field.helpText ? <p className={FIELD_HELP}>{field.helpText}</p> : null}
    </div>
  )
}
