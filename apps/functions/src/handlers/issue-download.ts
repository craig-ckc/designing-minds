import type { Product, ProductFile } from '@designing-minds/cms/types'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireVerifiedUser } from '../lib/auth.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { createSupabaseStorageProvider } from '../lib/storage.ts'

interface DownloadInput {
  orderId: string
  fileId: string
}

interface OrderRow {
  id: string
  customerId: string
  status: string
  items: { productSlug: string }[]
}

function isDownloadInput(value: unknown): value is DownloadInput {
  const v = value as DownloadInput
  return typeof value === 'object' && value !== null && typeof v.orderId === 'string' && typeof v.fileId === 'string'
}

const findFile = (products: Product[], fileId: string): ProductFile | null => {
  for (const product of products) {
    const file = product.purchasedFiles.find((entry) => entry.id === fileId)
    if (file) return file
  }
  return null
}

const includesByRules = (plan: Product, candidate: Product): boolean => {
  if (candidate.productKind !== 'Individual Resource') return false
  if (plan.includedProductSlugs?.includes(candidate.slug)) return true
  if (plan.includedGrades?.length && !plan.includedGrades.includes(candidate.grade)) return false
  if (plan.includedTerms?.length && !plan.includedTerms.includes(candidate.term)) return false
  if (plan.includedSubjects?.length && !candidate.subjects.some((subject) => plan.includedSubjects?.includes(subject))) return false
  return Boolean(plan.includedGrades?.length || plan.includedTerms?.length || plan.includedSubjects?.length)
}

const entitledProducts = (purchasedProducts: Product[], catalogue: Product[]): Product[] => {
  const bySlug = new Map(catalogue.map((product) => [product.slug, product]))
  const entitled = new Map<string, Product>()

  for (const product of purchasedProducts) {
    if (product.productKind === 'Individual Resource') entitled.set(product.slug, product)

    for (const slug of product.includedProductSlugs ?? []) {
      const included = bySlug.get(slug)
      if (included) entitled.set(included.slug, included)
    }

    if (product.productKind === 'Bundle' || product.productKind === 'Access Plan') {
      for (const candidate of catalogue) {
        if (includesByRules(product, candidate)) entitled.set(candidate.slug, candidate)
      }
    }
  }

  return [...entitled.values()]
}

export const issueDownload: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isDownloadInput(req.body)) return badRequest('Expected { orderId, fileId }.')

  let user
  try {
    user = await requireVerifiedUser(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
  }

  try {
    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,customerId,status,items')
      .eq('id', req.body.orderId)
      .maybeSingle<OrderRow>()
    if (orderError) throw new Error(orderError.message)
    // Treat "not found" and "not yours" identically so order ids can't be enumerated.
    if (!order || order.customerId !== user.id) return unauthorized('This order is not available on your account.')
    if (!['paid', 'fulfilled'].includes(order.status)) return unauthorized('Downloads unlock once payment succeeds.')

    const productSlugs = [...new Set(order.items.map((item) => item.productSlug))]
    const { data: purchasedProducts, error: productsError } = await supabase.from('products').select('*').in('slug', productSlugs)
    if (productsError) throw new Error(productsError.message)

    const purchased = (purchasedProducts ?? []) as Product[]
    const hasComposite = purchased.some((product) => product.productKind === 'Bundle' || product.productKind === 'Access Plan')
    let catalogue = purchased
    if (hasComposite) {
      const { data: catalogueProducts, error: catalogueError } = await supabase.from('products').select('*')
      if (catalogueError) throw new Error(catalogueError.message)
      catalogue = (catalogueProducts ?? []) as Product[]
    }

    const file = findFile(entitledProducts(purchased, catalogue), req.body.fileId)
    if (!file) return unauthorized('This file is not available on your order.')
    if (!file.storageKey) throw new Error('Product file is missing a storage key.')

    const storage = createSupabaseStorageProvider()
    const expiresInSeconds = 300
    const url = await storage.getSignedDownloadUrl(file.storageKey, expiresInSeconds, file.filename)
    return ok({ url, expiresInSeconds, filename: file.filename })
  } catch (error) {
    console.error('issue-download failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to issue download.')
  }
}
