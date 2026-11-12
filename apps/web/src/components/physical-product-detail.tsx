import { useMemo, useState } from 'react'
import {
  physicalSelectionValidation,
  physicalUnitPriceZar,
  priceLabel,
  promotionPrice,
  type CustomizationRule,
  type PhysicalCatalogProduct,
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

const labelForOption = (key: string) => {
  if (key.toLowerCase() === 'color' || key.toLowerCase() === 'colour') return 'Colour'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

const visibleCustomizationRules = (
  rules: CustomizationRule[],
  variantKeys: ReadonlySet<string>,
) => rules.filter((rule) => !variantKeys.has(rule.key))

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
  const [adding, setAdding] = useState(false)

  const variant = product.variants.find((entry) => entry.id === variantId)
    ?? product.variants.find((entry) => entry.available)
    ?? product.variants[0]
  const optionKeys = useMemo(() => [...new Set(product.variants.flatMap((entry) => Object.keys(entry.optionValues)))], [product.variants])
  const optionKeySet = useMemo(() => new Set(optionKeys), [optionKeys])
  const rules = useMemo(() => visibleCustomizationRules(product.customizationRules, optionKeySet)
    .sort((a, b) => Number(b.key === product.pricingFieldKey) - Number(a.key === product.pricingFieldKey)),
  [product.customizationRules, product.pricingFieldKey, optionKeySet])
  // Variant options have their own immutable order snapshot. Only fields
  // declared as customisation rules may travel in the customisations object.
  const values = Object.fromEntries(product.customizationRules.flatMap((rule) => {
    const value = optionKeySet.has(rule.key) ? ownString(variant?.optionValues, rule.key) : ownString(customizationValues, rule.key)
    return value === undefined || value === '' ? [] : [[rule.key, value]]
  }))
  const validationError = variant
    ? physicalSelectionMessage(product, physicalSelectionValidation(product, variant.id, quantity, values))
    : 'No product options are available right now.'
  const available = Boolean(variant?.available)
  const perCharacterField = product.pricingMode === 'per_character' ? product.pricingFieldKey : null
  const nameValue = perCharacterField ? ownString(values, perCharacterField) ?? '' : ''
  const billableCharacters = new Set(Array.from(product.billableCharacters ?? ''))
  const billableCount = Array.from(nameValue).filter((character) => billableCharacters.has(character)).length
  const unitPrice = variant ? physicalUnitPriceZar(product, variant, values) : 0
  const lineTotal = unitPrice * (Number.isInteger(quantity) && quantity > 0 ? quantity : 1)
  const basePrice = variant?.unitPriceZar ?? promotionPrice(product)

  const updateCustomization = (key: string, value: string) => {
    setCustomizationValues((current) => ({ ...current, [key]: value }))
    setMessage(null)
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
                      {billableCount} billable {billableCount === 1 ? 'letter' : 'letters'} × {priceLabel(basePrice)} = <strong className="text-ink">{priceLabel(unitPrice)} per item</strong>
                    </p>
                  ) : <p className="text-body text-muted">Enter a name to calculate the item price.</p>}
                  {quantity > 1 && billableCount > 0 ? <p className="text-body text-ink-soft">{quantity} items · {priceLabel(lineTotal)}</p> : null}
                </div>
              ) : (
                <div className="grid gap-1">
                  <p className="text-[1.75rem] font-semibold leading-snug tracking-[-0.03em]">{priceLabel(unitPrice)}</p>
                  {quantity > 1 ? <p className="text-body text-ink-soft">{quantity} items · {priceLabel(lineTotal)}</p> : null}
                </div>
              )}

              <div className="grid gap-4 border-t border-line pt-4">
                {rules.length > 0 ? (
                  <div className="grid gap-4">
                    {rules.map((rule) => {
                      const value = ownString(customizationValues, rule.key) ?? ''
                      if (rule.type === 'select') {
                        return (
                          <ProductOptionChoices
                            key={rule.key}
                            id={`custom-${product.id}-${rule.key}`}
                            label={rule.label}
                            required={rule.required}
                            colour={labelForOption(rule.key) === 'Colour'}
                            value={value}
                            options={[
                              ...(!rule.required ? [{ value: '', label: 'None' }] : []),
                              ...rule.options.map((option) => ({ value: option })),
                            ]}
                            onChange={(next) => updateCustomization(rule.key, next)}
                          />
                        )
                      }
                      return (
                        <div key={rule.key} className="grid gap-2">
                          <label htmlFor={`custom-${product.id}-${rule.key}`} className={`text-label font-semibold ${rule.required ? 'text-primary-ink' : 'text-ink'}`}>{rule.label}{rule.required ? <RequiredMark /> : null}</label>
                          <input
                            id={`custom-${product.id}-${rule.key}`}
                            className={`field ${rule.required ? 'border-primary/60 bg-primary-tint/30' : ''}`}
                            type="text"
                            autoComplete="off"
                            required={rule.required}
                            aria-describedby={rule.constraints?.maxLength !== undefined ? `custom-help-${product.id}-${rule.key}` : undefined}
                            value={value}
                            onChange={(event) => updateCustomization(rule.key, event.target.value)}
                          />
                          {rule.constraints?.maxLength !== undefined ? (
                            <p id={`custom-help-${product.id}-${rule.key}`} className="text-caption text-muted">Up to {rule.constraints.maxLength} characters.</p>
                          ) : null}
                          {rule.key === perCharacterField && value ? (
                            <div className="rounded-md bg-surface-alt px-3 py-2 text-body text-ink-soft" aria-live="polite">
                              Name preview: <strong className="text-ink">{value}</strong>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                {optionKeys.map((key) => {
                  const matchingVariant = ownString(variant?.optionValues, key) ?? ''
                  const options = [...new Set(product.variants.map((entry) => ownString(entry.optionValues, key)).filter((value): value is string => Boolean(value)))]
                  return (
                    <ProductOptionChoices
                      key={key}
                      id={`variant-${product.id}-${key}`}
                      label={labelForOption(key)}
                      colour={labelForOption(key) === 'Colour'}
                      value={matchingVariant}
                      options={options.map((option) => ({
                        value: option,
                        disabled: !product.variants.some((entry) => ownString(entry.optionValues, key) === option && entry.available),
                      }))}
                      onChange={(next) => selectOption(key, next)}
                    />
                  )
                })}

                <div className="grid gap-2">
                  <label htmlFor={`quantity-${product.id}`} className="text-label font-semibold text-ink">Quantity</label>
                  <QuantityInput
                    id={`quantity-${product.id}`}
                    label="Quantity"
                    value={quantity}
                    onChange={(next) => { setQuantity(next); setMessage(null) }}
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
