import {
  getFaqsByIds,
  getProductBySlug,
  getSubjectsForProduct,
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
const DEFAULT_DESCRIPTION =
  'CAPS-aligned tests, assessments, and summaries for Grades 3–7. Instant download after payment, print at home.'

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
    description: 'Find CAPS-aligned learning resources organised by grade, from Grade 3 to Grade 7.',
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
    description: 'Teacher-led, CAPS-aligned learning resources for South African primary-school learners.',
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

interface PageMeta {
  title: string
  description: string
  canonical: string
  ogType: 'website' | 'article' | 'product'
}

const metaTags = ({ title, description, canonical, ogType }: PageMeta): string =>
  [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  ].join('\n    ')

interface Crumb {
  name: string
  path: string
}

const breadcrumbList = (siteUrl: string, crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${siteUrl}${crumb.path}`,
  })),
})

const organization = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: `${siteUrl}/`,
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

/* --------------------------------- Per route --------------------------- */

/** Generate the full <head> tag block for a prerendered route. */
export function renderHead(route: PublicRoute, snapshot: CmsSnapshot, siteUrl: string): string {
  const canonical = `${siteUrl}${route.path === '/' ? '/' : route.path}`
  const jsonLd: unknown[] = []

  let meta: PageMeta

  if (route.kind === 'product' && route.productSlug) {
    const product = getProductBySlug(snapshot, route.productSlug)
    if (!product) throw new Error(`SEO: product not found for slug "${route.productSlug}"`)
    const title = product.seo?.title?.trim() || `${product.title} | ${SITE_NAME}`
    const description = product.seo?.description?.trim() || product.shortDescription || DEFAULT_DESCRIPTION
    meta = { title, description, canonical, ogType: 'product' }

    const subjects = getSubjectsForProduct(snapshot, product)
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description,
      sku: product.slug,
      category: subjects.map((subject) => subject.name).join(', ') || product.resourceFormat,
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
    const count = productsForGrade(snapshot, grade).length
    const title = `${grade} CAPS resources | ${SITE_NAME}`
    const description = GRADE_BLURB[grade] ?? `CAPS-aligned tests and summaries for ${grade}.`
    meta = { title, description: count ? `${description} ${count} resources available.` : description, canonical, ogType: 'website' }
    jsonLd.push(
      breadcrumbList(siteUrl, [
        { name: 'Home', path: '/' },
        { name: 'Grades', path: '/grades' },
        { name: grade, path: route.path },
      ]),
    )
  } else {
    const fallback = STATIC_META[route.path] ?? { title: SITE_NAME, description: DEFAULT_DESCRIPTION }
    meta = { ...fallback, canonical, ogType: 'website' }

    if (route.path === '/') {
      jsonLd.push(organization(siteUrl), website(siteUrl))
    }
    if (route.path === '/help') {
      const faqs = snapshot.faqs.filter((faq) => faq.published)
      if (faqs.length > 0) jsonLd.push(faqPage(faqs))
    }
    // Breadcrumbs on browse, support, and legal pages (everything but home).
    if (route.path !== '/') {
      jsonLd.push(
        breadcrumbList(siteUrl, [
          { name: 'Home', path: '/' },
          { name: fallback.title.split('|')[0].split('—')[0].trim(), path: route.path },
        ]),
      )
    }
  }

  return [metaTags(meta), ...jsonLd.map(jsonLdScript)].join('\n    ')
}

/* ------------------------------ Sitemap + robots ----------------------- */

/** sitemap.xml for indexable routes (functional + redirect sources excluded). */
export function sitemapXml(routes: PublicRoute[], siteUrl: string): string {
  const urls = routes
    .map((route) => {
      const loc = `${siteUrl}${route.path === '/' ? '/' : route.path}`
      return `  <url>\n    <loc>${escapeHtml(loc)}</loc>\n  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** robots.txt allowing public pages and disallowing functional routes. */
export function robotsTxt(disallowPaths: readonly string[], siteUrl: string): string {
  const lines = ['User-agent: *', 'Allow: /', ...disallowPaths.map((path) => `Disallow: ${path}`), '', `Sitemap: ${siteUrl}/sitemap.xml`, '']
  return lines.join('\n')
}
