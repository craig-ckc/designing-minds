import {
  getFaqsByIds,
  getProductBySlug,
  productsForGrade,
  type CmsSnapshot,
  type Faq,
} from '@designing-minds/cms'
import { CONTACT, GRADE_BLURB } from './content/site'
import type { PublicRoute } from './static-routes'

/* -------------------------------------------------------------------------
   Build-time SEO + AEO head generation.

   Maps a route match plus CMS data to a string of <head> tags: title, meta
   description, canonical, robots, Open Graph, Twitter card, and JSON-LD. The
   prerender step injects the result into each page's <head>. Output is a plain
   string (not React) because it is written straight into the HTML template.
   ------------------------------------------------------------------------- */

export const SITE_NAME = 'Designing Minds'
export const DEFAULT_DESCRIPTION =
  'CAPS-aligned tests, assessments, and summaries for Grades 3–7. CAPS is South Africa’s Curriculum and Assessment Policy Statement. Instant download; print at home.'

/** Site-wide social share image (1200×630). No per-product images exist yet, so
 *  every page shares this default until product artwork is added to the CMS. */
const DEFAULT_OG_IMAGE = '/og-image.png'
const OG_IMAGE_ALT = 'Designing Minds — CAPS-aligned assessments and resources'
/** Content locale: South African English. */
const OG_LOCALE = 'en_ZA'

interface StaticMeta {
  title: string
  description: string
}

const STATIC_META: Record<string, StaticMeta> = {
  '/': {
    title: 'Designing Minds — CAPS-Aligned Assessments & Resources',
    description: DEFAULT_DESCRIPTION,
  },
  '/shop': {
    title: 'Shop CAPS-aligned resources | Designing Minds',
    description: 'Browse and filter CAPS-aligned tests, assessments, and summaries for Grades 3–7.',
  },
  '/grades': {
    title: 'Browse resources by grade | Designing Minds',
    description:
      'Find CAPS-aligned learning resources organised by grade, from Grade 3 to Grade 7. CAPS is South Africa’s Curriculum and Assessment Policy Statement.',
  },
  '/packages': {
    title: 'Bundles & Access Plans | Designing Minds',
    description:
      'Save with bundles and Essential or Premium Access Plans that cover a grade for a term or the full year.',
  },
  '/help': {
    title: 'Help & FAQs | Designing Minds',
    description: 'Answers to common questions about downloads, payments, CAPS alignment, and your Customer Account.',
  },
  '/about': {
    title: 'About Designing Minds',
    description:
      'Teacher-led, CAPS-aligned learning resources for South African primary-school learners. CAPS means Curriculum and Assessment Policy Statement.',
  },
  '/contact': {
    title: 'Contact Designing Minds',
    description: `Get in touch with Designing Minds. Email ${CONTACT.email} or call ${CONTACT.phone}.`,
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Designing Minds',
    description: 'How Designing Minds collects, uses, and protects your personal information.',
  },
  '/terms': {
    title: 'Terms & Conditions | Designing Minds',
    description: 'The terms that govern your use of Designing Minds and purchases of downloadable resources.',
  },
  '/refund-policy': {
    title: 'Refund Policy | Designing Minds',
    description: 'How refunds work for downloadable CAPS-aligned resources purchased from Designing Minds.',
  },
}

/* --------------------------------- Escaping ---------------------------- */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** JSON-LD must not be able to break out of its <script> via "</script>". */
const jsonLdScript = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

/* ------------------------------- Tag builders -------------------------- */

export interface PageMeta {
  title: string
  description: string
  canonical: string
  ogType: 'website' | 'article' | 'product'
  /** Absolute URL of the social share image. */
  image: string
}

const metatags = ({ title, description, canonical, ogType, image }: PageMeta): string =>
  [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:locale" content="${OG_LOCALE}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('\n    ')

interface Crumb {
  name: string
  path: string
}

const breadcrumbList = (siteUrl: string, crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'breadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${siteUrl}${crumb.path}`,
  })),
})

const organization = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  // EducationalOrganization is the precise entity type for an edtech publisher;
  // it inherits every Organization property (logo, contact, etc.) and gives AI
  // answer engines a clearer signal about what this business is.
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  url: `${siteUrl}/`,
  logo: `${siteUrl}/favicon.svg`,
  image: `${siteUrl}${DEFAULT_OG_IMAGE}`,
  description: DEFAULT_DESCRIPTION,
  email: CONTACT.email,
  telephone: CONTACT.phone,
  areaServed: 'ZA',
  address: { '@type': 'PostalAddress', addressLocality: CONTACT.location },
})

const website = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: `${siteUrl}/`,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/shop?query={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})

const faqPage = (faqs: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
})

/**
 * LearningResource description of a product. This is the schema AI answer
 * engines lean on for education queries ("CAPS grade 4 maths test"): it exposes
 * grade level, subject, resource type, and explicit CAPS curriculum alignment.
 */
const learningResource = (opts: {
  name: string
  description: string
  url: string
  image: string
  grade: string
  subjects: string[]
  resourceFormat: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: opts.name,
  description: opts.description,
  url: opts.url,
  image: opts.image,
  inLanguage: 'en-ZA',
  isAccessibleForFree: false,
  learningResourceType: opts.resourceFormat,
  educationalLevel: opts.grade,
  educationalUse: 'assessment',
  ...(opts.subjects.length ? { about: opts.subjects.map((name) => ({ '@type': 'Thing', name })) } : {}),
  educationalAlignment: {
    '@type': 'AlignmentObject',
    alignmentType: 'educationalFramework',
    educationalFramework: 'CAPS (Curriculum and Assessment Policy Statement, South Africa)',
    targetName: [opts.grade, ...opts.subjects].join(' · '),
  },
})

/** ItemList of product URLs — helps crawlers and AI engines read a listing page. */
const itemList = (siteUrl: string, name: string, itemPaths: string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: itemPaths.length,
  itemListElement: itemPaths.map((path, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}${path}`,
  })),
})

/* --------------------------------- Per route --------------------------- */

/**
 * Resolve the per-page title/description/canonical/image for a route. Pure and
 * data-only (no JSON-LD), so the client head manager can reuse it on SPA
 * navigation to keep the tab title + share tags in sync with the build output.
 */
export function pageMetaFor(route: PublicRoute, snapshot: CmsSnapshot, siteUrl: string): PageMeta {
  const canonical = `${siteUrl}${route.path === '/' ? '/' : route.path}`
  const image = `${siteUrl}${DEFAULT_OG_IMAGE}`

  if (route.kind === 'product' && route.productSlug) {
    const product = getProductBySlug(snapshot, route.productSlug)
    if (!product) throw new Error(`SEO: product not found for slug "${route.productSlug}"`)
    const title = product.seo?.title?.trim() || `${product.title} | ${SITE_NAME}`
    const description = product.seo?.description?.trim() || product.shortDescription || DEFAULT_DESCRIPTION
    return { title, description, canonical, ogType: 'product', image }
  }

  if (route.kind === 'grade' && route.grade) {
    const grade = route.grade
    const count = productsForGrade(snapshot, grade).length
    const title = `${grade} CAPS resources | ${SITE_NAME}`
    const base = GRADE_BLURB[grade] ?? `CAPS-aligned tests and summaries for ${grade}.`
    const description = count ? `${base} ${count} resources available.` : base
    return { title, description, canonical, ogType: 'website', image }
  }

  const fallback = STATIC_META[route.path] ?? { title: SITE_NAME, description: DEFAULT_DESCRIPTION }
  return { ...fallback, canonical, ogType: 'website', image }
}

/** Generate the full <head> Tag block for a prerendered route. */
export function renderHead(route: PublicRoute, snapshot: CmsSnapshot, siteUrl: string): string {
  const meta = pageMetaFor(route, snapshot, siteUrl)
  const { canonical, image } = meta
  const jsonLd: unknown[] = []

  if (route.kind === 'product' && route.productSlug) {
    // pageMetaFor already threw if the product is missing, so it exists here.
    const product = getProductBySlug(snapshot, route.productSlug)!
    const subjectNames = product.subjects
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: meta.description,
      image: [image],
      sku: product.slug,
      category: subjectNames.join(', ') || product.resourceFormat,
      brand: { '@type': 'Brand', name: SITE_NAME },
      offers: {
        '@type': 'Offer',
        price: product.priceZar,
        priceCurrency: 'ZAR',
        availability: 'https://schema.org/InStock',
        url: canonical,
      },
    })
    jsonLd.push(
      learningResource({
        name: product.title,
        description: meta.description,
        url: canonical,
        image,
        grade: product.grade,
        subjects: subjectNames,
        resourceFormat: product.resourceFormat,
      }),
    )
    jsonLd.push(
      breadcrumbList(siteUrl, [
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/shop' },
        { name: product.title, path: route.path },
      ]),
    )
    const faqs = getFaqsByIds(snapshot, product.faqs)
    if (faqs.length > 0) jsonLd.push(faqPage(faqs))
  } else if (route.kind === 'grade' && route.grade) {
    const grade = route.grade
    const products = productsForGrade(snapshot, grade).filter((product) => product.published)
    jsonLd.push(
      breadcrumbList(siteUrl, [
        { name: 'Home', path: '/' },
        { name: 'Grades', path: '/grades' },
        { name: grade, path: route.path },
      ]),
    )
    if (products.length > 0) {
      jsonLd.push(itemList(siteUrl, `${grade} CAPS resources`, products.map((product) => `/shop/${product.slug}`)))
    }
  } else {
    if (route.path === '/') {
      jsonLd.push(organization(siteUrl), website(siteUrl))
    }
    if (route.path === '/shop') {
      const products = snapshot.products.filter((product) => product.published)
      if (products.length > 0) {
        jsonLd.push(itemList(siteUrl, 'CAPS-aligned resources', products.map((product) => `/shop/${product.slug}`)))
      }
    }
    if (route.path === '/help') {
      const faqs = snapshot.faqs.filter((faq) => faq.published)
      if (faqs.length > 0) jsonLd.push(faqPage(faqs))
    }
    // breadcrumbs on browse, support, and legal pages (everything but home).
    if (route.path !== '/') {
      jsonLd.push(
        breadcrumbList(siteUrl, [
          { name: 'Home', path: '/' },
          { name: meta.title.split('|')[0].split('—')[0].trim(), path: route.path },
        ]),
      )
    }
  }

  return [metatags(meta), ...jsonLd.map(jsonLdScript)].join('\n    ')
}

/* ------------------------------ Sitemap + robots ----------------------- */

/** sitemap.xml for indexable routes (functional + redirect sources excluded). */
export function sitemapXml(routes: PublicRoute[], siteUrl: string, lastmod?: string): string {
  // A single build-wide lastmod (the snapshot's generatedAt) is honest: every
  // page is regenerated from the same snapshot on each deploy.
  const day = lastmod ? lastmod.slice(0, 10) : undefined
  const urls = routes
    .map((route) => {
      const loc = `${siteUrl}${route.path === '/' ? '/' : route.path}`
      const lastmodtag = day ? `\n    <lastmod>${day}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmodtag}\n  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** robots.txt allowing public pages and disallowing functional routes. */
export function robotsTxt(disallowPaths: readonly string[], siteUrl: string): string {
  const lines = ['User-agent: *', 'Allow: /', ...disallowPaths.map((path) => `Disallow: ${path}`), '', `Sitemap: ${siteUrl}/sitemap.xml`, '']
  return lines.join('\n')
}

/**
 * llms.txt — an emerging convention (llmstxt.org) that gives AI answer engines a
 * curated, plain-text map of the site. Lists the key indexable pages grouped by
 * section so a model can orient without crawling. Functional/noindex routes are
 * omitted for the same reason they are kept out of the sitemap.
 */
export function llmsTxt(routes: PublicRoute[], siteUrl: string): string {
  const link = (path: string, label: string) => `- [${label}](${siteUrl}${path === '/' ? '/' : path})`

  const staticRoutes = routes.filter((route) => route.kind === 'static')
  const gradeRoutes = routes.filter((route) => route.kind === 'grade')
  const productRoutes = routes.filter((route) => route.kind === 'product')

  const staticLabels: Record<string, string> = {
    '/': 'Home',
    '/shop': 'Shop — browse and filter all resources',
    '/grades': 'Browse by grade',
    '/packages': 'Bundles & Access Plans',
    '/help': 'Help & FAQs',
    '/about': 'About Designing Minds',
    '/contact': 'Contact',
    '/privacy-policy': 'Privacy Policy',
    '/terms': 'Terms & Conditions',
    '/refund-policy': 'Refund Policy',
  }

  const sections: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${DEFAULT_DESCRIPTION}`,
    '',
    '## Pages',
    ...staticRoutes.map((route) => link(route.path, staticLabels[route.path] ?? route.path)),
  ]

  if (gradeRoutes.length > 0) {
    sections.push('', '## Resources by grade', ...gradeRoutes.map((route) => link(route.path, `${route.grade} CAPS resources`)))
  }
  if (productRoutes.length > 0) {
    sections.push('', '## Products', ...productRoutes.map((route) => link(route.path, route.productSlug ?? route.path)))
  }

  return sections.join('\n') + '\n'
}
