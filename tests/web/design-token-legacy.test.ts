import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'

// Guards against reintroducing the pre-sync design tokens. Tailwind v4 silently
// generates nothing for an unknown class, so a stale name is an invisible bug.
const srcDir = new URL('../../apps/web/src', import.meta.url).pathname

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|css)$/.test(entry.name) ? [path] : []
  })
}

const files = sourceFiles(srcDir).map((path) => ({
  path: relative(srcDir, path),
  lines: readFileSync(path, 'utf8').split('\n'),
}))

// Layout tokens that intentionally keep off-grid spacing.
const sectionRules = new Set(['@apply py-9 sm:py-12 lg:py-16;', '@apply py-7 sm:py-9 lg:py-11;'])

const spacing = String.raw`(?:gap-x|gap-y|gap|space-x|space-y|px|py|pt|pb|pl|pr|ps|pe|p|mx|my|mt|mb|ml|mr|ms|me|m)`

const rules: Array<{ name: string; pattern: RegExp }> = [
  { name: 'legacy radius utility', pattern: /rounded(?:-[a-z]{1,2})?-(?:control|card|chip|panel|pill)\b/ },
  { name: 'legacy radius variable', pattern: /--radius-(?:control|card|chip|panel|pill)/ },
  { name: 'legacy type size', pattern: /text-(?:page-title|price|heading-(?:md|sm|xs)|stat|quote|body-sm)\b/ },
  { name: 'removed primary tone', pattern: /(?:primary-deep|primary-edge)/ },
  { name: 'removed paper colour', pattern: /bg-paper\b/ },
  {
    name: 'legacy pastel colour name',
    pattern: new RegExp(String.raw`\b(?:bg|text|border|fill|stroke|from|to|via|ring|outline|decoration|divide)-(?:butter|amber|blossom|meadow|forest|periwinkle|navy|lagoon)\b`),
  },
  { name: 'off-grid spacing', pattern: new RegExp(String.raw`(?<![\w-])-?${spacing}-(?:1\.5|2\.5|3\.5|7|9|11|14)(?![\w.\-/\[])`) },
]

test('apps/web/src contains no legacy design-token names or off-grid spacing', () => {
  const violations: string[] = []
  for (const file of files) {
    file.lines.forEach((line, index) => {
      if (sectionRules.has(line.trim())) return
      for (const rule of rules) {
        const match = line.match(rule.pattern)
        if (match) violations.push(`${file.path}:${index + 1} ${rule.name}: ${match[0]}`)
      }
    })
  }
  assert.deepEqual(violations, [])
})

test('the navy key in product-option-colours is a CMS colour option, not a token', () => {
  const source = files.find((file) => file.path === 'lib/product-option-colours.ts')
  assert.ok(source)
  assert.ok(source.lines.some((line) => /\bnavy\b/.test(line)))
})
