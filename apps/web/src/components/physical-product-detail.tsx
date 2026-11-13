import { useMemo, useState } from 'react'
import {
  applicableRules,
  billableLetterCount,
  choiceDetails,
  choiceLabel,
  choiceSurchargeZar,
  normalizeCustomizations,
  physicalSelectionValidation,
  physicalUnitPriceZar,
  priceLabel,
  promotionPrice,
  type PhysicalCatalogProduct,
  type TextCustomizationRule,
  type VariantOptionDefinition,
} from '@designing-minds/cms'
import { Link } from 'react-router-dom'
import { Breadcrumb } from './ui/breadcrumb'
import { Button } from './ui/button'
import { Container } from './ui/container'
import { Icon } from './ui/icon'
import { Markdown } from '../lib/markdown'
import { addPhysicalCartLine } from '../lib/physical-cart'
import { usePhysicalAvailability } from '../lib/physical-availability'
import { physicalSelectionMessage, readPhysicalValue as ownString, selectPhysicalVariant } from '../lib/physical-variants'
import { PhysicalProductGallery } from './ui/physical-product-gallery'
import { QuantityInput } from './ui/quantity-input'
import { ProductOptionChoices, RequiredMark } from './ui/product-option-choices'
import { LetterTilesPreview } from './ui/letter-tiles-preview'
import { optionColour } from '../lib/product-option-colours'

const labelForOption = (key: string) => {
  if (key.toLowerCase() === 'color' || key.toLowerCase() === 'colour') return 'Colour'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Declared stocked options; catalogues published before options were declared derive them from the variants. */
function declaredOptions(product: PhysicalCatalogProduct): VariantOptionDefinition[] {
  if (product.variantOptions?.length) return product.variantOptions
  const keys = [...new Set(product.variants.flatMap((entry) => Object.keys(entry.optionValues)))]
  return keys.map((key) => ({
    key,
    label: labelForOption(key),
    display: labelForOption(key) === 'Colour' ? 'swatches' : 'buttons',
    values: [...new Set(product.variants.map((entry) => ownString(entry.optionValues, key)).filter((value): value is string => Boolean(value)))].map((value) => ({ value })),
  }))
}

const LETTER_SETS = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz']

/** The rules a shopper needs before typing: "Letters A–Z, no spaces, up to 10 characters." */
function textRuleHint(rule: TextCustomizationRule): string {
  const allowed = rule.constraints?.allowedCharacters
  const parts = [
    allowed ? (LETTER_SETS.includes(allowed) ? 'letters A–Z' : `only ${Array.from(allowed).slice(0, 30).join(' ')}`) : null,
    rule.constraints?.allowSpaces !== true ? 'no spaces' : null,
    rule.constraints?.maxLength !== undefined ? `up to ${rule.constraints.maxLength} characters` : null,
  ].filter((part): part is string => Boolean(part))
  if (!parts.length) return ''
  const sentence = parts.join(', ')
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`
}

/** The colour the preview should use: the chosen value of the first swatch option. */
function previewColourFor(options: VariantOptionDefinition[], chosen: Record<string, string> | undefined): { colour?: string; name?: string } {
  const option = options.find((entry) => entry.display === 'swatches')
  const name = option ? ownString(chosen, option.key) : undefined
  if (!option || !name) return {}
  return { colour: option.values.find((entry) => entry.value === name)?.swatch ?? optionColour(name), name: name.toLowerCase() }
}

export function PhysicalProductDetail({ product: publishedProduct }: { product: PhysicalCatalogProduct }) {
  const { availableIds, checkFailed, retry } = usePhysicalAvailability(publishedProduct.id)
  const product = useMemo(() => availableIds ? {
    ...publishedProduct,
    variants: publishedProduct.variants.map((variant) => ({ ...variant, available: availableIds.has(variant.id) })),
  } : publishedProduct, [publishedProduct, availableIds])
  const [variantId, setVariantId] = useState<string | null>(null)
  const [customizationValues, setCustomizationValues] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  // A problem with one question is shown under that question, not only by the button.
  const [fieldError, setFieldError] = useState<{ key: string; text: string } | null>(null)
  const [filtered, setFiltered] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const variant = product.variants.find((entry) => entry.id === variantId)
    ?? product.variants.find((entry) => entry.available)
    ?? product.variants[0]
  const options = useMemo(() => declaredOptions(product), [product])
  const chosenOptions = variant?.optionValues
  // Only questions that apply to the chosen variant are asked (e.g. the
  // teacher's name on the Large bag only); the per-letter field comes first.
  const rules = applicableRules(product.customizationRules, chosenOptions)
    .sort((a, b) => Number(b.key === product.pricingFieldKey) - Number(a.key === product.pricingFieldKey))
  // Answers travel with the cart line exactly as checkout prices them.
  const values = normalizeCustomizations(product.customizationRules, Object.fromEntries(rules.flatMap((rule) => {
    const value = ownString(customizationValues, rule.key)
    return value === undefined || value === '' ? [] : [[rule.key, value]]
  })), chosenOptions)
  const validationError = variant
    ? physicalSelectionMessage(product, physicalSelectionValidation(product, variant.id, quantity, values))
    : 'No product options are available right now.'
  const available = Boolean(variant?.available)
  const perCharacterField = product.pricingMode === 'per_character' ? product.pricingFieldKey : null
  const billableCount = billableLetterCount(product, values)
  const surcharge = variant ? choiceSurchargeZar(product, variant, values) : 0
  const previewField = product.previewTemplate === 'letter-tiles'
    ? perCharacterField ?? rules.find((rule) => rule.type === 'text')?.key ?? null
    : null
  const preview = previewColourFor(options, chosenOptions)
  const unitPrice = variant ? physicalUnitPriceZar(product, variant, values) : 0
  const lineTotal = unitPrice * (Number.isInteger(quantity) && quantity > 0 ? quantity : 1)
  const basePrice = variant?.unitPriceZar ?? promotionPrice(product)

  const updateCustomization = (key: string, value: string) => {
    setCustomizationValues((current) => ({ ...current, [key]: value }))
    setMessage(null)
    setFieldError((current) => current?.key === key ? null : current)
  }

  /** Keep only characters the question accepts, saying so when something was left out. */
  const typeText = (rule: TextCustomizationRule, raw: string) => {
    const typed = rule.transform === 'uppercase' ? raw.toUpperCase() : raw
    const allowed = rule.constraints?.allowedCharacters
    const spaces = rule.constraints?.allowSpaces === true
    // Same rule as checkout: spaces only when allowed; otherwise the configured characters.
    const kept = Array.from(typed).filter((character) => character === ' ' ? spaces : !allowed || allowed.includes(character)).join('')
    setFiltered(kept !== typed ? rule.key : null)
    updateCustomization(rule.key, kept)
  }

  const selectOption = (key: string, value: string) => {
    if (!variant) return
    const candidate = selectPhysicalVariant(product.variants, variant, key, value)
    if (candidate) {
      setVariantId(candidate.id)
      setMessage(null)
    }
  }

  const addToCart = () => {
    if (!variant || validationError) {
      const raw = variant ? physicalSelectionValidation(product, variant.id, quantity, values) : null
      const key = raw?.match(/^Customization value "(.+?)" /)?.[1]
      if (key && validationError) {
        setFieldError({ key, text: validationError })
        setMessage(null)
        const field = document.getElementById(`custom-${product.id}-${key}`) ?? document.querySelector<HTMLElement>(`[name="custom-${product.id}-${key}"]`)
        field?.focus()
        field?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
        return
      }
      setMessage({ kind: 'error', text: validationError ?? 'Choose an available option.' })
      return
    }
    setAdding(true)
    try {
      addPhysicalCartLine({
        productSlug: product.slug,
        variantId: variant.id,
        quantity,
        customizations: values,
      })
      setMessage({ kind: 'success', text: `${product.title} added to your cart.` })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Unable to add this item to your cart.' })
    } finally {
      setAdding(false)
    }
  }

  const renderRule = (rule: typeof rules[number]) => {
    const value = ownString(customizationValues, rule.key) ?? ''
    if (rule.type === 'select') {
      const choices = rule.options.map((option) => {
        const choice = choiceDetails(option)
        return { value: choice.value, label: choiceLabel(option), swatch: choice.swatch, note: choice.priceDeltaZar ? `+ ${priceLabel(choice.priceDeltaZar)}` : undefined }
      })
      if (rule.display === 'dropdown') {
        return (
          <div key={rule.key} className="grid gap-2">
            <label htmlFor={`custom-${product.id}-${rule.key}`} className={`text-label font-semibold ${rule.required ? 'text-primary-ink' : 'text-ink'}`}>{rule.label}{rule.required ? <RequiredMark /> : null}</label>
            {rule.help ? <p id={`custom-help-${product.id}-${rule.key}`} className="text-caption text-muted">{rule.help}</p> : null}
            <select id={`custom-${product.id}-${rule.key}`} className="field" required={rule.required} aria-describedby={rule.help ? `custom-help-${product.id}-${rule.key}` : undefined} value={value} onChange={(event) => updateCustomization(rule.key, event.target.value)}>
              <option value="">{rule.required ? 'Choose an option' : 'None'}</option>
              {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}{choice.note ? ` (${choice.note})` : ''}</option>)}
            </select>
          </div>
        )
      }
      return (
        <ProductOptionChoices
          key={rule.key}
          id={`custom-${product.id}-${rule.key}`}
          label={rule.label}
          description={rule.help}
          required={rule.required}
          colour={rule.display === 'swatches' || labelForOption(rule.key) === 'Colour'}
          value={value}
          options={[
            ...(!rule.required ? [{ value: '', label: 'None' }] : []),
            ...choices,
          ]}
          onChange={(next) => updateCustomization(rule.key, next)}
          error={fieldError?.key === rule.key ? fieldError.text : undefined}
        />
      )
    }
    const limit = rule.constraints?.maxLength
    const hintId = `custom-help-${product.id}-${rule.key}`
    const errorId = `custom-error-${product.id}-${rule.key}`
    const invalid = fieldError?.key === rule.key
    const hint = [rule.help, textRuleHint(rule)].filter(Boolean).join(' ')
    return (
      <div key={rule.key} className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={`custom-${product.id}-${rule.key}`} className={`text-label font-semibold ${rule.required ? 'text-primary-ink' : 'text-ink'}`}>{rule.label}{rule.required ? <RequiredMark /> : null}</label>
          {limit !== undefined ? <span className="text-caption tabular-nums text-muted" aria-hidden="true">{Array.from(value).length}/{limit}</span> : null}
        </div>
        <input
          id={`custom-${product.id}-${rule.key}`}
          className={`field ${invalid ? 'border-danger' : rule.required ? 'border-primary/60 bg-primary-tint/30' : ''}`}
          type="text"
          autoComplete="off"
          autoCapitalize={rule.transform === 'uppercase' ? 'characters' : undefined}
          maxLength={limit}
          required={rule.required}
          aria-invalid={invalid || undefined}
          aria-describedby={[invalid ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
          value={value}
          onChange={(event) => typeText(rule, event.target.value)}
        />
        {invalid ? <p id={errorId} className="text-caption font-semibold text-danger">{fieldError.text}</p> : null}
        {hint ? <p id={hintId} className="text-caption text-muted">{hint}</p> : null}
        {filtered === rule.key ? <p role="status" className="text-caption text-muted">Some characters can’t be used here and were left out.</p> : null}
        {rule.key === previewField ? (
          <div className="rounded-md bg-surface-alt px-4 py-3">
            <LetterTilesPreview text={value} colour={preview.colour} colourName={preview.name} />
          </div>
        ) : rule.key === perCharacterField && value ? (
          <div className="rounded-md bg-surface-alt px-3 py-2 text-body text-ink-soft" aria-live="polite">
            Name preview: <strong className="text-ink">{value}</strong>
          </div>
        ) : null}
      </div>
    )
  }
  // Questions for every option come first (the keyring's name), then the
  // options, then questions that depend on the chosen option (the Large bag's
  // teacher name).
  const leadingRules = rules.filter((rule) => !rule.appliesWhen)
  const dependentRules = rules.filter((rule) => rule.appliesWhen)

  const unavailable = product.variants.length === 0 || !available

  return (
    <>
      <section className="product-detail py-8 sm:py-10 lg:py-12">
        <Container width="full">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }]} current={product.title} />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10 xl:gap-16">
            <div className="min-w-0 lg:sticky lg:top-[var(--sticky-offset)]">
              <PhysicalProductGallery product={product} />
            </div>

            <form className="order-first grid min-w-0 gap-4 rounded-md border border-line p-5 sm:p-6 lg:order-none lg:p-8" noValidate onSubmit={(event) => { event.preventDefault(); addToCart() }}>
              {!available ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span role="status" className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-caption font-semibold text-canvas">Out of stock</span>
                </div>
              ) : null}
              <h1 className="text-2xl font-bold leading-snug tracking-[-0.02em]">{product.title}</h1>
              {product.shortDescription.trim() ? <p className="text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p> : null}

              {product.pricingMode === 'per_character' ? (
                <div className="grid gap-1">
                  <p className="text-[1.75rem] font-semibold leading-snug tracking-[-0.03em]">{priceLabel(basePrice)} per letter</p>
                  {billableCount > 0 ? (
                    <p className="text-body text-ink-soft">
                      {billableCount} {billableCount === 1 ? 'letter' : 'letters'} × {priceLabel(basePrice)}{surcharge > 0 ? <> + {priceLabel(surcharge)} for options</> : null} = <strong className="text-ink">{priceLabel(unitPrice)} per item</strong>
                    </p>
                  ) : <p className="text-body text-muted">Enter a name to calculate the item price.</p>}
                  {quantity > 1 && billableCount > 0 ? <p className="text-body text-ink-soft">{quantity} items · {priceLabel(lineTotal)}</p> : null}
                </div>
              ) : (
                <div className="grid gap-1">
                  <p className="text-[1.75rem] font-semibold leading-snug tracking-[-0.03em]">{priceLabel(unitPrice)}</p>
                  {surcharge > 0 ? <p className="text-body text-ink-soft">Includes {priceLabel(surcharge)} for your chosen options</p> : null}
                  {quantity > 1 ? <p className="text-body text-ink-soft">{quantity} items · {priceLabel(lineTotal)}</p> : null}
                </div>
              )}
              <div className="grid gap-4 border-t border-line pt-4">

                {leadingRules.length > 0 ? <div className="grid gap-4">{leadingRules.map(renderRule)}</div> : null}

                {options.map((option) => {
                  const offered = option.values.filter((entry) => product.variants.some((candidate) => ownString(candidate.optionValues, option.key) === entry.value))
                  if (offered.length === 0) return null
                  return (
                    <ProductOptionChoices
                      key={option.key}
                      id={`variant-${product.id}-${option.key}`}
                      label={option.label}
                      colour={option.display === 'swatches'}
                      value={ownString(variant?.optionValues, option.key) ?? ''}
                      options={offered.map((entry) => {
                        const match = variant ? selectPhysicalVariant(product.variants, variant, option.key, entry.value) : undefined
                        const notes = [
                          match && match.unitPriceZar != null && match.unitPriceZar !== promotionPrice(product) && product.pricingMode === 'fixed' ? priceLabel(match.unitPriceZar) : null,
                          match?.madeToOrder ? 'Made to order' : null,
                        ].filter(Boolean)
                        return {
                          value: entry.value,
                          swatch: entry.swatch,
                          note: notes.length ? notes.join(' · ') : undefined,
                          disabled: !product.variants.some((candidate) => ownString(candidate.optionValues, option.key) === entry.value && candidate.available),
                        }
                      })}
                      onChange={(next) => selectOption(option.key, next)}
                    />
                  )
                })}

                {dependentRules.length > 0 ? <div className="grid gap-4">{dependentRules.map(renderRule)}</div> : null}

                {variant?.madeToOrder ? (
                  <p className="text-body text-ink-soft">Made to order{product.leadTimeDays ? ` · ships within ${product.leadTimeDays} working ${product.leadTimeDays === 1 ? 'day' : 'days'}` : ''}.</p>
                ) : null}

                <div className="grid gap-2">
                  <label htmlFor={`quantity-${product.id}`} className="text-label font-semibold text-ink">Quantity</label>
                  <QuantityInput
                    id={`quantity-${product.id}`}
                    label="Quantity"
                    value={quantity}
                    onChange={(next) => { setQuantity(next); setMessage(null) }}
                    className="justify-self-start"
                  />
                </div>

                {message?.kind === 'error' ? <p className="text-body text-danger" role="alert">{message.text}</p> : null}
                {message?.kind === 'success' ? (
                  <div className="grid gap-2" role="status" aria-live="polite">
                    <p className="text-body text-primary-ink">{message.text}</p>
                    <Button to="/cart" variant="solid-light" className="w-full">View cart <Icon name="cart" size={16} /></Button>
                  </div>
                ) : null}
                <Button type="submit" variant="solid" className="w-full" disabled={unavailable || adding} loading={adding}>
                  <Icon name="cart" size={16} />
                  {unavailable ? 'Out of stock' : 'Add to cart'}
                </Button>
                <p className="text-caption text-muted">Your item and options are saved in the cart. Final availability and delivery are confirmed at checkout.</p>
                {checkFailed ? (
                  <div className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
                    <span role="status">Couldn’t refresh stock availability.</span>
                    <Button type="button" variant="text" size="sm" onClick={retry}>Check stock again</Button>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line">
                <details className="group border-b border-line py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-body font-semibold text-ink marker:hidden">
                    Product details <Icon name="chevron" size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 text-body text-ink-soft">
                    {product.fullDescription.trim() ? <Markdown source={product.fullDescription} /> : <p>See the options above for this product.</p>}
                  </div>
                </details>
                <details className="group border-b border-line py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-body font-semibold text-ink marker:hidden">
                    Delivery information <Icon name="chevron" size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-body text-ink-soft">Delivery choices and any shipping charge are shown during checkout.</p>
                </details>
              </div>
              <Link to="/shop" className="text-body text-ink underline underline-offset-4">Continue browsing</Link>
            </form>
          </div>
        </Container>
      </section>
    </>
  )
}
