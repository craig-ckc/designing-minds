import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const SRC = new URL('../../apps/admin/src/', import.meta.url).pathname
const read = (path: string) => readFileSync(join(SRC, path), 'utf8')

function sources(dir = ''): string[] {
  return readdirSync(join(SRC, dir)).flatMap((entry) => {
    const rel = dir ? `${dir}/${entry}` : entry
    if (statSync(join(SRC, rel)).isDirectory()) return sources(rel)
    return /\.tsx?$/.test(entry) ? [rel] : []
  })
}

const theme = read('index.css')
/** Names declared in the `@theme` block, per namespace: `--text-ui` -> "ui". */
function declared(namespace: string): Set<string> {
  const names = new Set<string>()
  for (const [, name] of theme.matchAll(new RegExp(`^\\s*--${namespace}-([a-z0-9-]+):`, 'gm'))) {
    // `--text-ui--line-height` declares a *property of* text-ui, not a new size.
    if (!name.includes('--')) names.add(name)
  }
  return names
}

/* -------------------------------------------------------------------------
   The type scale is the whole point of the system: the admin previously had
   nineteen one-off `text-[0.8?rem]` sizes doing the work of about five roles.
   ------------------------------------------------------------------------- */

test('no admin source hard-codes a font size', () => {
  const offenders: string[] = []
  for (const file of sources()) {
    for (const [match] of read(file).matchAll(/text-\[[0-9.]+(?:rem|px|em)\]/g)) {
      offenders.push(`${file}: ${match}`)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Use a --text-* role from index.css instead of an arbitrary size:\n${offenders.join('\n')}`,
  )
})

test('no admin source uses the public site type scale', () => {
  // apps/web's roles (text-body, text-caption, text-page-title…) are not
  // declared in the admin's @theme, so they silently resolve to nothing.
  const webRoles = /\btext-(body|body-sm|body-lg|caption|label|page-title|display|quote)\b/g
  const offenders: string[] = []
  for (const file of sources()) {
    for (const [match] of read(file).matchAll(webRoles)) offenders.push(`${file}: ${match}`)
  }
  assert.deepEqual(offenders, [], `apps/web type roles don't exist in the admin theme:\n${offenders.join('\n')}`)
})

/* -------------------------------------------------------------------------
   The admin owns its design system. Borrowing the public site's `cn` was what
   made the size tokens collide with colours in the first place.
   ------------------------------------------------------------------------- */

test('the admin imports cn from its own design folder, never from the shared utils', () => {
  const offenders = sources().filter(
    (file) => file !== 'design/index.ts' && /import\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*'@designing-minds\/utils'/.test(read(file)),
  )
  assert.deepEqual(offenders, [], `These must import cn from the design folder:\n${offenders.join('\n')}`)
})

test('the design folder is the only source of composed class strings', () => {
  // `components/tokens.ts` used to hold CARD/FIELD and was described as
  // "mirrored from the public web app" — the mirror is what this replaces.
  assert.throws(() => read('components/tokens.ts'), /ENOENT/, 'components/tokens.ts should be gone')
  const index = read('design/index.ts')
  for (const token of ['CARD', 'FIELD']) {
    assert.ok(read('design/tokens.ts').includes(`export const ${token}`), `design/tokens.ts should export ${token}`)
  }
  assert.ok(index.includes("export * from './tokens'"))
})

/* -------------------------------------------------------------------------
   tailwind-merge can't discover theme tokens; design/cn.ts has to be told
   about them by hand, so the two lists drift silently. An unregistered size
   is treated as a *colour* and gets dropped by the next `text-*` in the
   string — a bug with no error message, which is why this is a test.
   ------------------------------------------------------------------------- */

test('design/cn.ts registers exactly the theme tokens that index.css declares', () => {
  const cn = read('design/cn.ts')
  const registered = (label: string) => {
    const match = new RegExp(`${label}:\\s*\\[([^\\]]*)\\]`).exec(cn)
    assert.ok(match, `design/cn.ts should register a ${label} list`)
    return new Set([...match[1].matchAll(/'([^']+)'/g)].map(([, name]) => name))
  }

  const fontSizes = new RegExp(`'font-size':\\s*\\[\\{\\s*text:\\s*\\[([^\\]]*)\\]`).exec(cn)
  assert.ok(fontSizes, 'design/cn.ts should register a font-size class group')
  const sizeNames = new Set([...fontSizes[1].matchAll(/'([^']+)'/g)].map(([, name]) => name))

  assert.deepEqual([...sizeNames].sort(), [...declared('text')].sort(), '--text-* tokens vs tailwind-merge font-size')
  assert.deepEqual([...registered('spacing')].sort(), [...declared('spacing')].sort(), '--spacing-* tokens')
  assert.deepEqual([...registered('radius')].sort(), [...declared('radius')].sort(), '--radius-* tokens')

  // Shadows: only the ones with a real value need registering; the `none`
  // placeholders exist purely so stray shadow-* utilities are no-ops.
  const realShadows = [...theme.matchAll(/^[ \t]*--shadow-([a-z0-9-]+):[ \t]+(?!none)/gm)].map(([, name]) => name)
  assert.deepEqual([...registered('shadow')].sort(), realShadows.sort(), '--shadow-* tokens with a value')
})

/* -------------------------------------------------------------------------
   Craig's brief: the chrome carries no tint. A warm grey is the difference
   between "a tool" and "a brochure", and it is invisible until you put the
   two side by side — so assert it rather than trusting the eye.
   ------------------------------------------------------------------------- */

const NEUTRALS = [
  'canvas',
  'surface',
  'surface-alt',
  'surface-sunk',
  'ink',
  'ink-soft',
  'muted',
  'line',
  'line-strong',
  'ph',
  'ph-glyph',
]

test('every neutral is a true grey — no warm or cool tint', () => {
  for (const name of NEUTRALS) {
    const match = new RegExp(`--color-${name}:\\s*#([0-9a-fA-F]{6})`).exec(theme)
    assert.ok(match, `--color-${name} should be declared as a 6-digit hex`)
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16))
    assert.ok(
      r === g && g === b,
      `--color-${name} is #${match[1]} (r${r} g${g} b${b}) — a neutral must have equal channels`,
    )
  }
})

test('the neutral ramp runs light to dark in the order the roles imply', () => {
  const level = (name: string) => {
    const match = new RegExp(`--color-${name}:\\s*#([0-9a-fA-F]{6})`).exec(theme)
    assert.ok(match)
    return parseInt(match[1].slice(0, 2), 16)
  }
  // Surfaces get darker as they recede; text gets lighter as it de-emphasises.
  assert.ok(level('surface') > level('surface-alt'), 'surface-alt must be darker than surface')
  assert.ok(level('surface-alt') > level('surface-sunk'), 'surface-sunk must be darker than surface-alt')
  assert.ok(level('line') > level('line-strong'), 'line-strong must read stronger than line')
  assert.ok(level('ink') < level('ink-soft'), 'ink-soft must be lighter than ink')
  assert.ok(level('ink-soft') < level('muted'), 'muted must be lighter than ink-soft')
})

/* -------------------------------------------------------------------------
   Density spine: the top bar, the records toolbar and the editor header are
   one band. When they were three hard-coded heights they drifted, and the
   record list stopped lining up with the editor beside it.
   ------------------------------------------------------------------------- */

test('the chrome bar, row and control heights are declared once', () => {
  for (const [name, value] of [
    ['bar', '2.5rem'],
    ['row', '2rem'],
    ['field', '1.5rem'],
  ]) {
    assert.match(theme, new RegExp(`--spacing-${name}:\\s*${value}`), `--spacing-${name} should be ${value}`)
  }
})

test('no chrome bar re-spells its own height', () => {
  // A bar that says `h-12` is a bar that will drift from the others.
  const offenders: string[] = []
  for (const file of sources()) {
    const body = read(file)
    for (const [match] of body.matchAll(/\bh-12\b|\bmin-h-12\b/g)) offenders.push(`${file}: ${match}`)
  }
  assert.deepEqual(offenders, [], `Use h-bar / min-h-bar:\n${offenders.join('\n')}`)
})

/* -------------------------------------------------------------------------
   The toggle's thumb and its track are three coupled numbers — track width,
   padding, thumb size — and the fourth (how far the thumb travels) is derived
   from them. Halving the track during the 2026-08-28 density pass without
   redoing that arithmetic left the thumb 2px taller than the space it sat in
   and overshooting its travel by 2px. Nothing catches that but the eye, so:
   ------------------------------------------------------------------------- */

test("the toggle's thumb fits its track and travels exactly the right distance", () => {
  // Comments are stripped first: this file's own comments explain the bug by
  // quoting the classes that caused it, which the assertions below would read
  // as the real thing.
  const switchSource = read('components/primitives/Switch.tsx')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  /** Tailwind's numeric scale is 4px per step: `w-7` = 28px, `p-0.5` = 2px. */
  const step = (source: string, pattern: RegExp) => {
    const match = pattern.exec(source)
    assert.ok(match, `Switch.tsx should state ${pattern}`)
    return Number(match[1]) * 4
  }

  const track = step(switchSource, /\bw-(\d+(?:\.\d+)?) flex-none rounded-full/)
  const padding = step(switchSource, /\bp-(\d+(?:\.\d+)?) transition-colors/)
  const thumb = step(switchSource, /Thumb className="block size-(\d+(?:\.\d+)?)/)
  const travel = step(switchSource, /data-\[checked\]:translate-x-(\d+(?:\.\d+)?)/)
  const border = 2 // `border` on the track, one pixel each side

  const inner = track - border - padding * 2
  assert.equal(
    travel,
    inner - thumb,
    `thumb travel is ${travel}px but the track's inner width (${inner}px) leaves ${inner - thumb}px — ` +
      'the thumb will stop short of, or ride over, the far edge',
  )

  // The track must NOT pin its own height: it has to be thumb + padding +
  // border, and stating it separately is what let the two disagree.
  assert.doesNotMatch(
    switchSource,
    /\bh-\d/,
    'the track height must stay derived from the thumb, not hard-coded',
  )
})
