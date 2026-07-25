import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

const SRC = new URL('../../apps/web/src/', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, SRC), 'utf8')

const sourceFiles = (dir: string): string[] => {
  const entries = readdirSync(new URL(dir, SRC), { withFileTypes: true })
  return entries.flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(`${dir}${entry.name}/`)
      : entry.name.endsWith('.tsx')
        ? [`${dir}${entry.name}`]
        : [],
  )
}

test('the nudging CTA arrow exists once as a component', () => {
  const icon = read('components/ui/icon.tsx')

  assert.match(icon, /export function ArrowAffordance/)
  assert.match(icon, /group-hover:translate-x-0\.5/)
})

test('no page or section re-declares the arrow wrapper by hand', () => {
  const offenders = sourceFiles('')
    .filter((path) => path !== 'components/ui/icon.tsx')
    .filter((path) => /<span className="h-(3\.5|4) w-(3\.5|4)[^"]*">\s*<Icon name="arrow"/.test(read(path)))

  assert.deepEqual(offenders, [], `hand-rolled arrow wrappers should use <ArrowAffordance />: ${offenders.join(', ')}`)
})
