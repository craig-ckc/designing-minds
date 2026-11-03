import assert from 'node:assert/strict'
import test from 'node:test'
import { buildHtml, buildShellHtml, createSnapshotAsset } from '../../apps/web/scripts/prerender-html.mjs'

const template = `<!doctype html>
<html>
  <head><title>Fallback</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`

test('prerendered pages reference one external snapshot instead of inlining catalogue data', () => {
  const marker = '<large-catalogue-payload>'.repeat(20_000)
  const asset = createSnapshotAsset({ products: [{ description: marker }] })
  const html = buildHtml({
    template,
    headTags: '<title>Page</title>',
    snapshotScript: asset.scriptTag,
    appHtml: '<main>Readable page content</main>',
  })

  assert.ok(asset.source.length > 400_000)
  assert.ok(html.length < 500)
  assert.doesNotMatch(html, /large-catalogue-payload/)
  assert.match(html, new RegExp(`<script src="/${asset.fileName}"></script>`))
  assert.ok(html.indexOf('Readable page content') < html.indexOf(asset.scriptTag))
  assert.ok(html.indexOf(asset.scriptTag) < html.indexOf('type="module"'))
})

test('snapshot asset is content-addressed and safe to execute as JavaScript', () => {
  const first = createSnapshotAsset({ value: '</script><script>alert(1)</script>' })
  const same = createSnapshotAsset({ value: '</script><script>alert(1)</script>' })
  const changed = createSnapshotAsset({ value: 'different' })

  assert.equal(first.fileName, same.fileName)
  assert.notEqual(first.fileName, changed.fileName)
  assert.doesNotMatch(first.source, /<\/script>/)
  assert.match(first.source, /\\u003c\/script>/)
})

test('direct account and cart links load the same published snapshot before the client starts', () => {
  const asset = createSnapshotAsset({ products: [{ slug: 'published-resource' }], orders: [], payments: [] })
  const html = buildShellHtml({ template, snapshotScript: asset.scriptTag })

  assert.match(html, /<div id="root"><\/div>/, 'functional routes render from an empty root')
  assert.match(html, /<meta name="robots" content="noindex"/)
  assert.ok(html.includes(asset.scriptTag))
  assert.ok(html.indexOf(asset.scriptTag) < html.indexOf('type="module"'))
  assert.doesNotMatch(html, /published-resource/, 'reuse the shared asset rather than duplicating the catalogue')
})
