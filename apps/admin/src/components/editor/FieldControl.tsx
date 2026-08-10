import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'
import type { ProductFile } from '@designing-minds/cms'
import type { AdminField, AdminRecord, FieldContext, ReferenceField, SelectField } from '../../cms/types'
import { getPath } from '../../cms/record'
import { FIELD } from '../tokens'
import { Icon } from '../ui'
import { Input, ReferencePicker, Select, Switch, Textarea, type SelectOption } from '../primitives'
import { FileListField } from './FileListField'
import { RichTextEditor } from './RichTextEditor'

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
        return <div className={cn(FIELD, 'whitespace-pre-line text-ink-soft')}>{text}</div>
      }

      /* Renders an object (e.g. a JSONB "data" bag) as read-only label/value
         rows, so new form fields surface automatically with no config change. */
      case 'keyValue': {
        const entries =
          value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value as Record<string, unknown>) : []
        if (entries.length === 0) {
          return <div className={cn(FIELD, 'text-ink-soft')}>No additional fields.</div>
        }
        return (
          <dl className="grid gap-2.5 rounded-control border border-line bg-surface-alt p-3">
            {entries.map(([key, entryValue]) => (
              <div key={key} className="grid gap-0.5">
                <dt className="text-[0.75rem] uppercase tracking-[0.06em] text-muted">{key}</dt>
                <dd className="whitespace-pre-wrap text-[0.9rem] text-ink">
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
          <div className="flex items-center gap-2.5">
            <Switch id={inputId} checked={checked} onCheckedChange={(next) => onUpdate(field.key, next)} disabled={disabled} />
            <span className="text-[0.88rem] text-ink-soft">{checked ? 'On' : 'Off'}</span>
          </div>
        )
      }

      case 'textarea':
        return (
          <Textarea id={inputId} value={String(value ?? '')} disabled={disabled} onChange={(e) => onUpdate(field.key, e.target.value)} />
        )

      case 'richText':
        return (
          <RichTextEditor
            id={inputId}
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
            value={String(value ?? '')}
            disabled={disabled}
            onChange={(e) => onUpdate(field.key, e.target.value)}
          />
        )

      case 'slug':
        return (
          <>
            <Input id={inputId} value={String(value ?? '')} disabled={disabled} onChange={(e) => onUpdate(field.key, e.target.value)} />
            {field.urlPrefix ? (
              <div className="mt-2 flex items-center gap-2 rounded-control border border-line bg-surface-alt px-3 py-2 text-[0.82rem] text-muted">
                <span className="h-3.5 w-3.5 flex-none">
                  <Icon name="external" />
                </span>
                <span className="min-w-0 break-all">
                  {field.urlPrefix}
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

  function renderReferenceSingle(reference: ReferenceField): ReactNode {
    const current = value == null ? '' : String(value)
    const options: SelectOption[] = current === '' ? [{ label: 'Select…', value: '' }] : []
    options.push(...ctx.optionsForReference(reference))
    return <Select id={inputId} value={current} disabled={disabled} options={options} onValueChange={(next) => onUpdate(field.key, next)} />
  }

  /* Type-ahead picker: type to filter, click to add — scales to large collections. */
  function renderMultiReference(reference: ReferenceField): ReactNode {
    const options = ctx.optionsForReference(reference)
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <ReferencePicker
        id={inputId}
        options={options}
        selected={selected}
        onChange={(next) => onUpdate(field.key, next)}
        disabled={disabled}
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
}

function FieldShell({ field, inputId, children }: { field: AdminField; inputId: string; children: ReactNode }) {
  // A file list is a group of controls, not one input, so its caption is a
  // plain label referenced by aria-labelledby rather than a <label htmlFor>
  // pointing at something that can't take focus.
  const Caption = field.type === 'fileList' ? 'span' : 'label'
  return (
    <div className="grid gap-2">
      <Caption
        id={`${inputId}:label`}
        htmlFor={field.type === 'fileList' ? undefined : inputId}
        className="text-[0.92rem] font-medium"
      >
        {field.label}
        {field.required ? <span className="text-muted"> *</span> : null}
      </Caption>
      {children}
      {field.helpText ? <p className="text-[0.82rem] text-muted">{field.helpText}</p> : null}
    </div>
  )
}
