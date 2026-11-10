import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return channels.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
}

function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

for (const app of ['web', 'admin']) {
  const css = readFileSync(new URL(`../../apps/${app}/src/index.css`, import.meta.url), 'utf8')
  const color = (name: string) => {
    const value = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
    assert.ok(value, `${app}: missing ${name}`)
    return value
  }
  test(`${app} primary action gradient keeps normal white labels readable at both stops`, () => {
    for (const name of ['primary-ink', 'primary-ink-strong']) {
      const ratio = contrast(color('on-primary'), color(name))
      assert.ok(ratio >= 4.5, `${app}: white on ${name} = ${ratio.toFixed(2)}:1`)
    }
    const gradient = css.match(/--gradient-primary:\s*linear-gradient\(([\s\S]*?)\);/)?.[1]
    assert.ok(gradient)
    assert.match(gradient, /var\(--color-primary-ink\) 0%/)
    assert.match(gradient, /var\(--color-primary-ink-strong\) 100%/)
  })

  if (app === 'admin') {
    test('admin secondary and muted text stay readable on neutral workspace surfaces', () => {
      for (const foreground of ['ink-soft', 'muted']) {
        for (const background of ['surface', 'surface-alt', 'surface-sunk']) {
          const ratio = contrast(color(foreground), color(background))
          assert.ok(ratio >= 4.5, `${foreground} on ${background} = ${ratio.toFixed(2)}:1`)
        }
      }
    })
  }
}
