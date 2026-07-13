import { useState, type DragEvent, type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'
import type { ProductFile } from '@designing-minds/cms'
import type { AdminField, AdminRecord, FieldContext, ReferenceField, SelectField } from '../../cms/types'
import { getPath } from '../../cms/record'
import { FIELD } from '../tokens'
import { Icon } from '../ui'
import { Button, Input, ReferencePicker, Select, Switch, Textarea, type SelectOption } from '../primitives'
import { RichTextEditor } from './RichTextEditor'

type Props = {
  field: AdminField
  record: AdminRecord
  ctx: FieldContext
  onUpdate: (key: string, value: unknown) => void
  onUpload?: (file: File) => void
  uploading?: boolean
  uploadError?: string | null
  disabled?: boolean
}

export function FieldControl({ field, record, ctx, onUpdate, onUpload, uploading, uploadError, disabled }: Props) {
  const value = getPath(record, field.key)
  const inputId = `${record.id}:${field.key}`
  const [dragActive, setDragActive] = useState(false)

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
          <dl className="grid gap-2.5 rounded-md border border-line bg-surface-alt p-3">
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
              <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.82rem] text-muted">
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

    const onDrop = (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      setDragActive(false)
      if (uploading) return
      const file = e.dataTransfer.files?.[0]
      if (file) onUpload?.(file)
    }

    return (
      <div className="grid gap-2">
        {!disabled ? (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              if (!dragActive) setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed px-4 py-5 text-center transition',
              dragActive ? 'border-primary bg-primary-tint' : 'border-line-strong bg-surface-alt hover:border-primary',
              uploading && 'pointer-events-none opacity-70',
            )}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-ink-soft">
              <span className="h-4 w-4">
                <Icon name="download" />
              </span>
            </span>
            <span className="text-[0.85rem] font-medium text-ink">
              {uploading ? 'Uploading…' : dragActive ? 'Drop to upload' : 'Drag & drop a file here'}
            </span>
            {!uploading ? (
              <span className="text-[0.8rem] text-muted">
                or <span className="font-medium text-primary">click to browse</span>
              </span>
            ) : null}
            <input
              className="sr-only"
              type="file"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && onUpload?.(e.target.files[0])}
            />
          </label>
        ) : null}
        {uploadError ? <p className="text-[0.82rem] text-danger">{uploadError}</p> : null}
        {files.length > 0 ? (
          <span className="text-[0.82rem] text-muted">
            {files.length} file{files.length === 1 ? '' : 's'} attached
          </span>
        ) : null}
        {files.length === 0 ? (
          disabled ? <p className="text-[0.85rem] text-muted">No files attached.</p> : null
        ) : (
          <ul className="grid gap-1.5">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-[0.9rem]">
                <span className="grid min-w-0 gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 text-muted">
                      <Icon name="doc" />
                    </span>
                    {file.label} · {file.filename}
                  </span>
                  <span className="truncate pl-6 text-[0.78rem] text-muted">{file.storageKey ?? 'No storage key yet'}</span>
                </span>
                {!disabled ? (
                  <Button variant="ghost" size="sm" onClick={() => onUpdate(field.key, files.filter((f) => f.id !== file.id))}>
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}

function FieldShell({ field, inputId, children }: { field: AdminField; inputId: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="text-[0.92rem] font-medium">
        {field.label}
        {field.required ? <span className="text-muted"> *</span> : null}
      </label>
      {children}
      {field.helpText ? <p className="text-[0.82rem] text-muted">{field.helpText}</p> : null}
    </div>
  )
}
