import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const pagesPath = path.join(root, 'research', 'extracted-content', 'data', 'pages.json')
const productsPath = path.join(root, 'research', 'extracted-content', 'data', 'products.json')
const outputPath = path.join(root, 'packages', 'cms', 'src', 'generated', 'seed.ts')

const decodeText = (value = '') =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim()

const titleCase = (value) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()

const inferProductPrice = (product) => {
  const title = product.title.toLowerCase()
  const excerpt = (product.excerpt || '').toLowerCase()
  const body = (product.body || '').toLowerCase()

  if (title.includes('full-year') || body.includes('full year') || excerpt.includes('full year')) {
    return 1200
  }

  if (title.includes('bundle') || product.inferred?.type === 'Bundle') {
    return 350
  }

  return 60
}

const inferProductStatus = (product) => {
  const modifiedAt = new Date(product.modified)
  const daysAgo = Math.max(0, Math.round((Date.now() - modifiedAt.getTime()) / (1000 * 60 * 60 * 24)))

  if (daysAgo <= 21) {
    return 'fresh'
  }

  if (product.inferred?.type === 'Bundle') {
    return 'featured'
  }

  return 'evergreen'
}

const extractPreviewLinks = (body = '') =>
  Array.from(body.matchAll(/https?:\/\/[^\s)]+/g), (match) => match[0]).slice(0, 6)

const createPageRecord = (page) => ({
  id: page.id,
  slug: page.slug,
  title: decodeText(page.title),
  excerpt: decodeText(page.excerpt || ''),
  body: decodeText(page.body || ''),
  url: page.url,
  date: page.date,
  modified: page.modified,
  menuOrder: page.menuOrder ?? 0,
  wordCount: page.wordCount ?? 0,
  status: page.slug === 'home' ? 'home' : page.wordCount > 0 ? 'published' : 'placeholder',
  summary: decodeText(page.excerpt || page.body || '').slice(0, 240)
})

const createProductRecord = (product) => {
  const inferred = product.inferred || {}
  const body = decodeText(product.body || '')
  const excerpt = decodeText(product.excerpt || '')
  const subjects = Array.isArray(inferred.subjects) && inferred.subjects.length > 0
    ? inferred.subjects.map((subject) => decodeText(subject))
    : ['General']
  const primarySubject = subjects[0]
  const type = decodeText(inferred.type || 'Resource')
  const priceZar = inferProductPrice(product)

  return {
    id: product.id,
    slug: product.slug,
    title: decodeText(product.title),
    excerpt,
    body,
    url: product.url,
    date: product.date,
    modified: product.modified,
    wordCount: product.wordCount ?? 0,
    grade: inferred.grade ? `Grade ${inferred.grade}` : 'General',
    term: inferred.term ? `Term ${inferred.term}` : 'Any Term',
    year: inferred.year ?? null,
    marks: inferred.marks ?? null,
    type,
    subjects,
    primarySubject,
    priceZar,
    priceLabel: `R${priceZar.toLocaleString('en-ZA')}`,
    status: inferProductStatus(product),
    previewLinks: extractPreviewLinks(body),
    tags: [
      inferred.grade ? `grade-${inferred.grade}` : null,
      inferred.term ? `term-${inferred.term}` : null,
      type.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      primarySubject.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    ].filter(Boolean)
  }
}

const pages = JSON.parse(await fs.readFile(pagesPath, 'utf8')).map(createPageRecord)
const products = JSON.parse(await fs.readFile(productsPath, 'utf8')).map(createProductRecord)

const grades = [...new Set(products.map((product) => product.grade))].sort((left, right) =>
  left.localeCompare(right, undefined, { numeric: true }),
)
const terms = [...new Set(products.map((product) => product.term))].sort((left, right) =>
  left.localeCompare(right, undefined, { numeric: true }),
)
const subjects = [...new Set(products.flatMap((product) => product.subjects))].sort()
const productTypes = [...new Set(products.map((product) => product.type))].sort()

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'About', to: '/about-3' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy', to: '/privacy-policy' }
]

const spotlight = {
  headline: 'Printable CAPS-Aligned Resources for Grades 3 to 7',
  subheading: 'Two apps, one content model: a public website for families and an admin workspace for updating products, pages, and future uploads.',
  planOptions: [
    {
      name: 'Essential Access',
      cadence: 'Per term',
      priceLabel: 'R350',
      description: 'A compact term bundle for one grade with all core subjects.'
    },
    {
      name: 'Premium Access',
      cadence: 'Per year',
      priceLabel: 'R1,200',
      description: 'Full-year access across grades, terms, and automatic updates.'
    }
  ]
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: 'https://designingminds.co.za',
  navigation,
  spotlight,
  filters: {
    grades,
    terms,
    subjects,
    productTypes
  },
  stats: {
    pageCount: pages.length,
    productCount: products.length,
    gradeCount: grades.length,
    subjectCount: subjects.length
  },
  pages,
  products
}

const fileContents = `import type { CmsSnapshot } from '../types'\n\nexport const seedSnapshot: CmsSnapshot = ${JSON.stringify(snapshot, null, 2)}\n`

await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, fileContents)

console.log(`Seed content generated at ${path.relative(root, outputPath)}`)
