import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'
import sharp from 'sharp'

const origin = 'http://cover-build.invalid'
const columns = 3
const batchSize = columns * 2
const maxBytes = 100_000

async function launchBrowser() {
  const executablePath = process.env.COVER_CHROMIUM_EXECUTABLE
  if (executablePath) return chromium.launch({ executablePath })
  if (process.platform === 'linux' && process.arch === 'x64') {
    const { default: bundled } = await import('@sparticuz/chromium')
    return chromium.launch({ executablePath: await bundled.executablePath(), args: bundled.args })
  }
  return chromium.launch({ channel: 'chrome' })
}

async function encodeCover(image, directory) {
  for (const quality of [52, 45, 38, 31, 24]) {
    const bytes = await image.clone().avif({ quality, effort: 4, chromaSubsampling: '4:4:4' }).toBuffer()
    if (bytes.length <= maxBytes) {
      const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 20)
      await writeFile(path.join(directory, `${hash}.avif`), bytes)
      return { url: `/covers/${hash}.avif`, size: bytes.length }
    }
  }
  throw new Error(`AVIF exceeded the ${maxBytes / 1000} KB cover budget`)
}

export async function renderCoverImages({ jobs, distDir, template, width, height, thumbnailWidth }) {
  const stylesheets = [...template.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(\/assets\/[^"]+\.css)"/g)]
    .map((match) => match[1])
  if (stylesheets.length === 0) throw new Error('The client build has no cover stylesheets')

  const directory = path.join(distDir, 'covers')
  await mkdir(directory, { recursive: true })
  const browser = await launchBrowser()
  const assets = Object.create(null)
  let largest = 0

  try {
    const page = await browser.newPage({
      viewport: { width: width * columns, height: height * (batchSize / columns) },
      deviceScaleFactor: 1,
    })
    let sheet = ''
    const failures = new Set()
    page.on('response', (response) => {
      if (!response.ok()) failures.add(new URL(response.url()).pathname)
    })
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== origin) return route.abort()
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: sheet })

      const isSource = /^\/subjects\/[a-z-]+\.avif$/.test(url.pathname)
        || ['/cover-source.svg', '/placeholder-image.svg', '/fonts/inter-latin-variable.woff2', ...stylesheets].includes(url.pathname)
      if (!isSource) return route.abort()
      return route.fulfill({ path: path.join(distDir, url.pathname.slice(1)) })
    })

    const links = stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`).join('')
    for (let offset = 0; offset < jobs.length; offset += batchSize) {
      const batch = jobs.slice(offset, offset + batchSize)
      // The rotated rear cover needs more side clearance for its shadow.
      const cells = batch.map(({ html, stacked }) =>
        `<div class="cell"><div style="width:${stacked ? 89 : 100}%">${html}</div></div>`,
      ).join('')
      sheet = `<!doctype html><meta charset="utf-8">${links}<style>
        html, body { margin: 0; background: transparent; }
        body { display: grid; grid-template-columns: repeat(${columns}, ${width}px); }
        .cell { width: ${width}px; height: ${height}px; display: grid; place-items: center; }
      </style><body>${cells}</body>`

      await page.goto(origin, { waitUntil: 'load' })
      await page.evaluate(async () => {
        const fonts = await document.fonts.load('800 16px Inter')
        if (fonts.length === 0) throw new Error('Cover font is missing')
        await Promise.all([...document.images].map((image) => {
          image.loading = 'eager'
          return image.decode()
        }))
      })
      if (failures.size > 0) throw new Error(`Could not load cover assets: ${[...failures].join(', ')}`)
      const png = await page.screenshot({ omitBackground: true })

      const files = await Promise.all(batch.map(async ({ key }, index) => {
        const frame = sharp(png).extract({
          left: (index % columns) * width,
          top: Math.floor(index / columns) * height,
          width,
          height,
        })
        try {
          const [thumbnail, full] = await Promise.all([
            encodeCover(frame.clone().resize({ width: thumbnailWidth }), directory),
            encodeCover(frame, directory),
          ])
          return { key, thumbnail, full }
        } catch (error) {
          throw new Error(`Could not encode cover ${key}`, { cause: error })
        }
      }))
      for (const { key, thumbnail, full } of files) {
        assets[key] = { thumbnail: thumbnail.url, full: full.url }
        largest = Math.max(largest, thumbnail.size, full.size)
      }
    }
  } finally {
    await browser.close()
  }

  await rm(path.join(distDir, 'cover-source.svg'))
  await rm(path.join(distDir, 'subjects'), { recursive: true })
  console.log(`[prerender] Rendered ${jobs.length} AVIF covers in two sizes (largest ${(largest / 1000).toFixed(1)} KB)`)
  return assets
}
