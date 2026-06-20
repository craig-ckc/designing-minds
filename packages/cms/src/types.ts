export type CmsPageStatus = 'home' | 'published' | 'placeholder'
export type CmsProductStatus = 'fresh' | 'featured' | 'evergreen'
export type CmsProviderMode = 'seed' | 'local' | 'supabase'

export interface CmsPage {
  id: number
  slug: string
  title: string
  excerpt: string
  body: string
  url: string
  date: string
  modified: string
  menuOrder: number
  wordCount: number
  status: CmsPageStatus
  summary: string
}

export interface CmsProduct {
  id: number
  slug: string
  title: string
  excerpt: string
  body: string
  url: string
  date: string
  modified: string
  wordCount: number
  grade: string
  term: string
  year: string | null
  marks: string | null
  type: string
  subjects: string[]
  primarySubject: string
  priceZar: number
  priceLabel: string
  status: CmsProductStatus
  previewLinks: string[]
  tags: string[]
}

export interface CmsNavigationItem {
  label: string
  to: string
}

export interface CmsSpotlightPlan {
  name: string
  cadence: string
  priceLabel: string
  description: string
}

export interface CmsSpotlight {
  headline: string
  subheading: string
  planOptions: CmsSpotlightPlan[]
}

export interface CmsFilters {
  grades: string[]
  terms: string[]
  subjects: string[]
  productTypes: string[]
}

export interface CmsStats {
  pageCount: number
  productCount: number
  gradeCount: number
  subjectCount: number
}

export interface CmsSnapshot {
  generatedAt: string
  source: string
  navigation: CmsNavigationItem[]
  spotlight: CmsSpotlight
  filters: CmsFilters
  stats: CmsStats
  pages: CmsPage[]
  products: CmsProduct[]
}

export interface CmsRepository {
  mode: CmsProviderMode
  canWrite: boolean
  getSnapshot: () => Promise<CmsSnapshot>
  savePage: (page: CmsPage) => Promise<CmsPage>
  saveProduct: (product: CmsProduct) => Promise<CmsProduct>
  reset?: () => Promise<void>
}
