import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const outDir = resolve('docs/client')
const sourceDir = resolve(outDir, 'source')
mkdirSync(sourceDir, { recursive: true })

const generatedDate = '29 June 2026'

const docs = [
  {
    slug: '01-business-and-product-requirements',
    title: 'Business and Product Requirements',
    subtitle: 'Designing Minds website prototype',
    intro:
      'This document captures our current interpretation of the business goals, customer needs, product assumptions, and core functionality in the working prototype.',
    sections: [
      {
        heading: 'Purpose of the Prototype',
        body: [
          'The prototype turns the current Designing Minds website and catalogue into a working experience that the client can review by using it directly.',
          'Instead of reviewing ideas in theory, the client can browse resources, open product pages, add items to cart, create an account, and see how purchased resources would be accessed after payment.',
        ],
      },
      {
        heading: 'Business Goals',
        bullets: [
          'Make the catalogue easier to understand and navigate.',
          'Give customers more than one way to find the right resource.',
          'Support once-off digital purchases for individual resources, packages, and access plans.',
          'Make premium offers, especially access plans, more visible.',
          'Reduce confusion around downloads by keeping purchases and files inside the customer account.',
          'Create a stronger foundation for future catalogue growth.',
        ],
      },
      {
        heading: 'Customer Goals',
        bullets: [
          'Quickly find resources by grade, subject, term, format, or offer type.',
          'Use a simpler grade-based journey when the full catalogue feels overwhelming.',
          'Compare individual resources, packages, and access plans before buying.',
          'Review cart contents before checkout.',
          'Create or use a customer account to complete checkout.',
          'Return to the account later to view orders and download purchased files.',
        ],
      },
      {
        heading: 'Core Functionality in the Prototype',
        bullets: [
          'Public pages: Home, About, Contact, Help, legal pages, and catalogue browse pages.',
          'Catalogue browsing: Shop all resources, browse by grade, and browse packages/access plans.',
          'Product pages: price, grade, term, year, subject, product type, format, description, included content, and add-to-cart action.',
          'Cart and checkout: customers can add products to cart, review totals, and proceed to payment.',
          'Customer accounts: login, sign-up, account overview, order history, and order detail pages.',
          'Downloads: purchased files unlock on the order detail page after payment is confirmed.',
          'Admin foundation: products, subjects, FAQs, and testimonials can be managed as structured content.',
        ],
      },
      {
        heading: 'Current Assumptions',
        bullets: [
          'The main business value is catalogue clarity and easier buying, not a redesign of every static page.',
          'Home, About, and Contact are useful entry/support pages, but the catalogue journey is the main focus.',
          'All digital products are once-off purchases; access plans do not renew automatically.',
          'Checkout requires a customer account before payment can be completed.',
          'Access plans are selected for a grade during checkout.',
          'Packages, currently labelled as bundles in parts of the prototype, group resources into discounted once-off purchases.',
        ],
      },
      {
        heading: 'Out of Scope for This Review',
        bullets: [
          'Final copywriting for all marketing/static pages.',
          'Final brand design, photography, and visual polish.',
          'Final legal wording for privacy, terms, refunds, and licensing.',
          'Final payment-provider production setup.',
          'Final product file uploads and complete product descriptions for every resource.',
        ],
      },
      {
        heading: 'Questions for Client',
        bullets: [
          'Should the customer-facing label be Packages, Bundles, or another name?',
          'What is the exact difference customers should understand between a full-year package and a yearly access plan?',
          'Should access plans unlock all resources for one selected grade, or only a defined subset?',
          'Are grades 3-7 the correct launch range?',
          'Are there any resource types missing from the current structure, such as worksheets, memos, packs, or lesson plans?',
          'What must be true before the prototype can move from review to launch preparation?',
        ],
      },
    ],
  },
  {
    slug: '02-information-architecture',
    title: 'Information Architecture',
    subtitle: 'Sitemap and customer journeys',
    intro:
      'This document explains how the prototype organises the website so customers can reach the same catalogue through different paths.',
    sections: [
      {
        heading: 'Navigation Principle',
        body: [
          'The catalogue should not depend on one perfect route. Different customers search in different ways, so the prototype gives them multiple entry points into the same product set.',
          'A confident buyer can use Shop All. A customer who thinks by school year can start with Grades. A customer looking for value can start with Packages and Access Plans.',
        ],
      },
      {
        heading: 'Primary Sitemap',
        bullets: [
          'Home',
          'Shop / All resources',
          'Grades',
          'Grade detail pages for each grade',
          'Packages, currently shown in parts of the prototype as Bundles & access plans',
          'Product detail pages',
          'Cart',
          'Checkout',
          'Customer Account',
          'Order history',
          'Order detail and downloads',
          'Help',
          'Contact',
          'About',
          'Privacy Policy, Terms, and Refund Policy',
          'Login and Sign-up',
        ],
      },
      {
        heading: 'Main Access Points',
        bullets: [
          'Shop All: the full catalogue with search and filters.',
          'Grades: a simpler click-through journey for customers who want resources for a specific grade.',
          'Packages: grouped offers, including term packages, full-year packages, and access plans.',
          'Access Plan highlight: premium offers are shown prominently in the Shop navigation.',
          'Product Detail: the decision page where the customer reviews the offer and adds it to cart.',
        ],
      },
      {
        heading: 'Customer Journey 1: Browse All Resources',
        steps: [
          'Customer opens Shop / All resources.',
          'Customer searches or filters by grade, term, subject, format, or type.',
          'Customer opens a product detail page.',
          'Customer adds the product to cart.',
          'Customer checks out and downloads from their account after payment.',
        ],
      },
      {
        heading: 'Customer Journey 2: Browse by Grade',
        steps: [
          'Customer opens Grades.',
          'Customer selects the relevant grade.',
          'Customer sees resources for that grade and can narrow by term.',
          'Customer can move to advanced filters in Shop if needed.',
          'Customer opens a product or package and continues to cart.',
        ],
      },
      {
        heading: 'Customer Journey 3: Browse Packages and Access Plans',
        steps: [
          'Customer opens Packages.',
          'Customer compares term packages, full-year packages, and access plans.',
          'Customer opens the offer detail page to see what is included.',
          'If buying an access plan, customer chooses the grade during checkout.',
          'Downloads unlock from the order detail page after payment is confirmed.',
        ],
      },
      {
        heading: 'Customer Journey 4: Account and Downloads',
        steps: [
          'Customer logs in or creates an account.',
          'Customer sees account details and recent orders.',
          'Customer opens an order detail page.',
          'If payment is complete, the available files are shown as download buttons.',
          'If payment is still pending, the order page explains that downloads unlock after payment succeeds.',
        ],
      },
      {
        heading: 'Pages for Review',
        bullets: [
          'Does the main navigation use the correct labels?',
          'Is the grade-first path clear enough for non-technical customers?',
          'Does the Packages page explain the difference between offer types clearly?',
          'Should access plans be promoted more strongly in the main navigation or homepage?',
          'Are Help, Contact, and Account easy enough to find when a customer needs support?',
        ],
      },
      {
        heading: 'Questions for Client',
        bullets: [
          'Should the top navigation say Shop, All Resources, or another label?',
          'Should Packages have its own top-level link, or stay inside the Shop menu?',
          'Should each grade page show packages/access plans first, individual resources first, or both together?',
          'Are there customer journeys we have missed, such as teachers buying for multiple grades?',
        ],
      },
    ],
  },
  {
    slug: '03-product-catalog-structure',
    title: 'Product Catalog Structure',
    subtitle: 'Categories, product types, attributes, filters, and users',
    intro:
      'This document explains how the catalogue is structured so the client can review whether products are grouped, described, filtered, and sold correctly.',
    sections: [
      {
        heading: 'Catalogue Principle',
        body: [
          'Every sellable item is treated as a product. The product can be a single downloadable resource, a package of resources, or an access plan.',
          'This keeps the catalogue flexible while allowing customers to browse by different needs: grade, term, subject, resource format, or offer type.',
        ],
      },
      {
        heading: 'Product Types',
        bullets: [
          'Individual Resource: a single downloadable test, assessment, summary, or similar resource.',
          'Package: a grouped once-off purchase, such as a term package or full-year package. The prototype currently uses the technical label Bundle in some places.',
          'Access Plan: a premium once-off purchase that unlocks resources for a selected grade and period. The current model supports term or year access periods and does not renew automatically.',
        ],
      },
      {
        heading: 'Main Product Attributes',
        bullets: [
          'Title and short description.',
          'Full product description.',
          'Price.',
          'Grade.',
          'Term.',
          'Year.',
          'Product type: Individual Resource, Package, or Access Plan.',
          'Resource format, currently Test / Assessment or Summary.',
          'Subjects.',
          'Marks, where relevant.',
          'Preview files, where available.',
          'Purchased files.',
          'Included products for packages and access plans.',
          'Published and featured status.',
          'SEO title and description.',
        ],
      },
      {
        heading: 'Categories and Value Lists',
        bullets: [
          'Grades: Grade 3, Grade 4, Grade 5, Grade 6, and Grade 7.',
          'Terms: Term 1, Term 2, Term 3, and Term 4.',
          'Years: the curriculum or release year attached to the product.',
          'Subjects: managed as catalogue content so products can belong to one or more subjects.',
          'Resource formats: currently Test / Assessment and Summary, with room to add more later.',
          'Product types: Individual Resource, Package, and Access Plan.',
        ],
      },
      {
        heading: 'Filters and Customer Access Points',
        bullets: [
          'Shop filters by search, grade, term, subject, format, and type.',
          'Grade pages filter the catalogue to one grade and allow term narrowing.',
          'Packages separates term packages, full-year packages, and access plans.',
          'Product pages show related resources to keep customers moving through the catalogue.',
          'The navigation highlights access plans as premium offers.',
        ],
      },
      {
        heading: 'Customer and Order Records',
        bullets: [
          'Customers: account records used for login, checkout, order history, and downloads.',
          'Orders: purchase records created during checkout.',
          'Order items: the products purchased inside an order.',
          'Payments: payment-provider status and references connected to each order.',
          'Downloads: files are accessed through order detail pages after payment is confirmed.',
        ],
      },
      {
        heading: 'Current Interpretation of Packages vs Access Plans',
        body: [
          'A package appears to be a fixed group of resources sold as a discounted once-off purchase. For example, a term package or full-year package for a grade.',
          'An access plan appears to be a premium once-off purchase that unlocks resources for a selected grade and access period. It is chosen by grade during checkout and is not currently modelled as a recurring subscription.',
          'This difference should be confirmed because it affects naming, pricing, product descriptions, checkout wording, and customer expectations.',
        ],
      },
      {
        heading: 'Questions for Client',
        bullets: [
          'Should the final customer-facing term be Package rather than Bundle?',
          'What exactly is included in a full-year package?',
          'What exactly is included in a yearly access plan?',
          'Should access plans include future resources added during the access period, or only the resources available at purchase time?',
          'Should customers be able to buy access plans for more than one grade in one order?',
          'Are subjects and resource formats complete for launch?',
          'Do any products require variants, such as language, memo included/not included, or paper 1/paper 2?',
        ],
      },
    ],
  },
]

const css = `
@page {
  size: A4;
  margin: 18mm 18mm 17mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: #172033;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10.8pt;
  line-height: 1.45;
  background: #ffffff;
}

.doc {
  max-width: 760px;
  margin: 0 auto;
}

.topline {
  color: #667085;
  font-size: 8.5pt;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border-bottom: 1px solid #d8dee8;
  padding-bottom: 8px;
  margin-bottom: 22px;
}

h1 {
  color: #0b2545;
  font-size: 27pt;
  line-height: 1.08;
  margin: 0 0 6px;
  letter-spacing: 0;
}

.subtitle {
  color: #4b5870;
  font-size: 13pt;
  margin: 0 0 16px;
}

.intro {
  border-left: 4px solid #2e74b5;
  padding: 10px 14px;
  margin: 20px 0 24px;
  background: #f4f7fb;
  color: #26364f;
}

h2 {
  color: #2e74b5;
  font-size: 15pt;
  margin: 18px 0 8px;
  break-after: avoid;
}

p {
  margin: 0 0 8px;
}

ul,
ol {
  margin: 0 0 10px 20px;
  padding: 0;
}

li {
  margin: 0 0 5px;
  padding-left: 2px;
}

.section {
  break-inside: avoid;
}

.meta {
  color: #667085;
  font-size: 9pt;
  margin-bottom: 12px;
}

.questions {
  margin-top: 20px;
  padding: 12px 14px;
  background: #fbfaf3;
  border: 1px solid #e7dca8;
  break-inside: avoid;
}

.questions h2 {
  color: #7a5a00;
  margin-top: 0;
}
`

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const markdownFor = (doc) => {
  const lines = [
    `# ${doc.title}`,
    '',
    doc.subtitle,
    '',
    `Prepared for client review - ${generatedDate}`,
    '',
    doc.intro,
    '',
  ]
  for (const section of doc.sections) {
    lines.push(`## ${section.heading}`, '')
    if (section.body) {
      for (const paragraph of section.body) lines.push(paragraph, '')
    }
    if (section.bullets) {
      for (const item of section.bullets) lines.push(`- ${item}`)
      lines.push('')
    }
    if (section.steps) {
      section.steps.forEach((item, index) => lines.push(`${index + 1}. ${item}`))
      lines.push('')
    }
  }
  return `${lines.join('\n').trim()}\n`
}

const htmlFor = (doc) => {
  const sections = doc.sections
    .map((section) => {
      const body = section.body?.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n') ?? ''
      const bullets = section.bullets
        ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : ''
      const steps = section.steps
        ? `<ol>${section.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
        : ''
      const cls = section.heading === 'Questions for Client' ? 'section questions' : 'section'
      return `<section class="${cls}">\n<h2>${escapeHtml(section.heading)}</h2>\n${body}\n${bullets}\n${steps}\n</section>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(doc.title)}</title>
  <style>${css}</style>
</head>
<body>
  <main class="doc">
    <div class="topline">Designing Minds prototype review</div>
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="subtitle">${escapeHtml(doc.subtitle)}</p>
    <p class="meta">Prepared for client review - ${generatedDate}</p>
    <p class="intro">${escapeHtml(doc.intro)}</p>
    ${sections}
  </main>
</body>
</html>
`
}

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

for (const doc of docs) {
  const mdPath = resolve(sourceDir, `${doc.slug}.md`)
  const htmlPath = resolve(sourceDir, `${doc.slug}.html`)
  const pdfPath = resolve(outDir, `${doc.slug}.pdf`)

  writeFileSync(mdPath, markdownFor(doc))
  writeFileSync(htmlPath, htmlFor(doc))

  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--print-to-pdf=${pdfPath}`,
    '--no-pdf-header-footer',
    pathToFileURL(htmlPath).href,
  ])
}

console.log(`Generated ${docs.length} PDFs in ${outDir}`)
