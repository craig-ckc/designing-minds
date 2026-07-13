import { useRef, useState } from 'react'
import { cn } from '@designing-minds/utils'
import type { AdminCollection, AdminRecord, FieldContext } from '../../cms/types'
import { buildCsv, buildImportPlan, type ImportPlan } from '../../cms/csv-io'
import { downloadCsv } from '../../lib/csv'
import { Pill } from '../Badge'
import { Button, Dialog, ScrollArea } from '../primitives'

type Step =
  | { name: 'pick' }
  | { name: 'preview'; plan: ImportPlan; filename: string }
  | { name: 'applying'; total: number; done: number }
  | { name: 'done'; imported: number; failed: number; skipped: number }

/**
 * CSV import flow: choose a file → preview the validated plan (create/update
 * per row, row-level errors) → apply the valid rows one save at a time.
 * Nothing is written until the user confirms the preview.
 */
export function ImportDialog({
  open,
  onClose,
  collection,
  records,
  ctx,
  createBlank,
  onSave,
}: {
  open: boolean
  onClose: () => void
  collection: AdminCollection
  records: AdminRecord[]
  ctx: FieldContext
  createBlank: () => AdminRecord
  onSave: (record: AdminRecord) => Promise<AdminRecord | null>
}) {
  const [step, setStep] = useState<Step>({ name: 'pick' })
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep({ name: 'pick' })
    setFileError(null)
  }

  const close = () => {
    if (step.name === 'applying') return // don't abandon a run mid-write
    reset()
    onClose()
  }

  const handleFile = async (file: File) => {
    setFileError(null)
    try {
      const text = await file.text()
      const plan = buildImportPlan({ text, collection, records, ctx, createBlank })
      setStep({ name: 'preview', plan, filename: file.name })
    } catch {
      setFileError('Unable to read that file.')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const apply = async (plan: ImportPlan) => {
    const valid = plan.rows.filter((row) => row.errors.length === 0)
    const skipped = plan.rows.length - valid.length
    setStep({ name: 'applying', total: valid.length, done: 0 })
    let imported = 0
    let failed = 0
    for (const row of valid) {
      const saved = await onSave(row.record)
      if (saved) imported += 1
      else failed += 1
      setStep({ name: 'applying', total: valid.length, done: imported + failed })
    }
    setStep({ name: 'done', imported, failed, skipped })
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Import ${collection.label.toLowerCase()}`}
      className={cn(step.name === 'preview' && 'w-[min(760px,calc(100vw-2rem))]')}
    >
      {step.name === 'pick' ? (
        <div className="mt-3 grid gap-4">
          <p className="text-[0.9rem] leading-relaxed text-ink-soft">
            Upload a CSV whose header row uses the field keys of this collection. Rows with an existing{' '}
            <code className="rounded bg-surface-alt px-1">id</code> update that record; rows without an id create new{' '}
            {collection.label.toLowerCase()}. Blank cells keep the current value. Nothing is saved until you confirm the
            preview.
          </p>
          {fileError ? <p className="text-[0.85rem] text-danger">{fileError}</p> : null}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="solid" size="sm" onClick={() => fileInput.current?.click()}>
              Choose CSV file
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(`${collection.id}-template.csv`, buildCsv(collection, []))}
            >
              Download template
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="CSV file"
            onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
          />
        </div>
      ) : null}

      {step.name === 'preview' ? (
        <PreviewStep
          plan={step.plan}
          filename={step.filename}
          collection={collection}
          onBack={reset}
          onApply={() => void apply(step.plan)}
        />
      ) : null}

      {step.name === 'applying' ? (
        <p className="mt-4 text-[0.9rem] text-ink-soft">
          Importing… {step.done} of {step.total}
        </p>
      ) : null}

      {step.name === 'done' ? (
        <div className="mt-3 grid gap-4">
          <p className="text-[0.9rem] text-ink-soft">
            Imported {step.imported} {step.imported === 1 ? 'record' : 'records'}.
            {step.failed > 0 ? ` ${step.failed} failed to save.` : ''}
            {step.skipped > 0 ? ` ${step.skipped} row${step.skipped === 1 ? ' was' : 's were'} skipped due to errors.` : ''}
          </p>
          <div className="flex justify-end">
            <Button variant="solid" size="sm" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}

function PreviewStep({
  plan,
  filename,
  collection,
  onBack,
  onApply,
}: {
  plan: ImportPlan
  filename: string
  collection: AdminCollection
  onBack: () => void
  onApply: () => void
}) {
  const errorCount = plan.rows.length - plan.validCount
  const th = 'whitespace-nowrap px-3 py-2 text-left text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted'

  return (
    <div className="mt-3 grid min-h-0 gap-3">
      <p className="text-[0.88rem] text-ink-soft">
        <strong className="font-medium text-ink">{filename}</strong> — {plan.rows.length}{' '}
        {plan.rows.length === 1 ? 'row' : 'rows'}: {plan.validCount} valid
        {errorCount > 0 ? `, ${errorCount} with errors (skipped on import)` : ''}.
      </p>

      {plan.warnings.length > 0 ? (
        <ul className="grid gap-1 text-[0.82rem] text-muted">
          {plan.warnings.map((warning) => (
            <li key={warning}>· {warning}</li>
          ))}
        </ul>
      ) : null}

      {plan.rows.length > 0 ? (
        <div className="flex max-h-[320px] min-h-0 flex-col overflow-hidden rounded-md border border-line">
          <ScrollArea className="min-h-0 flex-1">
            <table className="w-full border-collapse text-[0.85rem]">
              <thead className="sticky top-0 z-10 bg-surface-alt">
                <tr className="border-b border-line">
                  <th className={th}>Line</th>
                  <th className={th}>{collection.singular}</th>
                  <th className={th}>Action</th>
                  <th className={th}>Issues</th>
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((row) => (
                  <tr key={row.line} className="border-b border-line last:border-b-0 align-top">
                    <td className="px-3 py-2 text-muted">{row.line}</td>
                    <td className="px-3 py-2 font-medium">{row.title}</td>
                    <td className="px-3 py-2">
                      <Pill tone={row.action === 'create' ? 'solid' : 'outline'}>{row.action}</Pill>
                    </td>
                    <td className="px-3 py-2">
                      {row.errors.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <ul className="grid gap-0.5 text-[0.82rem] text-danger">
                          {row.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2.5">
        <Button variant="outline" size="sm" onClick={onBack}>
          Choose another file
        </Button>
        <Button variant="solid" size="sm" onClick={onApply} disabled={plan.validCount === 0}>
          Import {plan.validCount} {plan.validCount === 1 ? 'row' : 'rows'}
        </Button>
      </div>
    </div>
  )
}
