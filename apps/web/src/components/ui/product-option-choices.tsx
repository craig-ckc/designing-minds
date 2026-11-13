import { Icon } from './icon'
import { optionColour } from '../../lib/product-option-colours'

export function RequiredMark() {
  return <><span aria-hidden="true" className="ml-1 text-primary-ink">*</span><span className="sr-only"> (required)</span></>
}

/** `swatch` is a configured #rrggbb colour; `note` is a short add-on such as “+ R 10”. */
type Choice = { value: string; label?: string; disabled?: boolean; swatch?: string; note?: string }

export function ProductOptionChoices({ id, label, options, value, onChange, required = false, colour = false, description, error }: {
  id: string
  label: string
  options: Choice[]
  value: string
  onChange: (value: string) => void
  required?: boolean
  colour?: boolean
  /** Instructions shown under the label. */
  description?: string
  /** A problem with the current choice, shown under the choices. */
  error?: string
}) {
  return (
    <fieldset className="min-w-0" aria-describedby={[error ? `${id}-error` : null, description ? `${id}-help` : null].filter(Boolean).join(' ') || undefined}>
      <legend className={`mb-3 text-label font-semibold ${required ? 'text-primary-ink' : 'text-ink'}`}>
        {label}{required ? <RequiredMark /> : null}
      </legend>
      {description ? <p id={`${id}-help`} className="-mt-2 mb-3 text-caption text-muted">{description}</p> : null}
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const swatch = option.swatch ?? (colour ? optionColour(option.value) : undefined)
          const selected = value === option.value
          return (
            <label key={option.value} className={`relative flex min-w-0 max-w-full flex-col items-center gap-2 ${option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <input
                className="peer sr-only"
                type="radio"
                name={id}
                value={option.value}
                checked={selected}
                disabled={option.disabled}
                required={required}
                onChange={() => onChange(option.value)}
              />
              {swatch ? (
                <>
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: swatch }}
                    className={`flex size-10 items-center justify-center rounded-sm border border-ink/20 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ink ${selected ? 'ring-3 ring-primary/40' : ''}`}
                  >
                    {selected ? <span className="flex size-6 items-center justify-center rounded-full bg-canvas text-primary-ink"><Icon name="check" size={17} /></span> : null}
                  </span>
                  <span className={`max-w-24 break-words text-center text-caption ${selected ? 'font-semibold text-primary-ink' : 'text-ink-soft'}`}>{option.label ?? option.value}{option.note ? <span className="block font-normal text-muted">{option.note}</span> : null}</span>
                </>
              ) : (
                <span className={`flex min-h-10 min-w-12 max-w-full items-center justify-center gap-2 rounded-sm border px-4 py-2 text-body peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-ink ${selected ? 'border-primary-ink bg-primary-tint font-semibold text-primary-ink' : 'border-line-strong bg-canvas text-ink'}`}>
                  {selected ? <Icon name="check" size={15} className="shrink-0" /> : null}
                  <span className="min-w-0 [overflow-wrap:anywhere]">{option.label ?? option.value}</span>
                  {option.note ? <span className="text-caption font-normal text-muted">{option.note}</span> : null}
                </span>
              )}
              {option.disabled ? <span className="text-caption text-muted">Out of stock</span> : null}
            </label>
          )
        })}
      </div>
      {error ? <p id={`${id}-error`} className="mt-2 text-caption font-semibold text-danger">{error}</p> : null}
    </fieldset>
  )
}
