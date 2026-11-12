import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Disclosure } from '../../../apps/web/src/components/ui/disclosure'

// The marker's open state is a CSS selector, so prove the selector matches this DOM.
const OPEN_SELECTOR = 'details[open] > summary *'
const OPEN_CLASS = '[details[open]>summary_&]:rotate-45'

const marker = (open: boolean) => {
  const { container } = render(<Disclosure title="Resource details" open={open || undefined}><p>Panel</p></Disclosure>)
  return { container, marker: container.querySelector('summary > span[aria-hidden="true"]')! }
}

describe('Disclosure marker', () => {
  it('rotates into a × only while its own disclosure is open', () => {
    const open = marker(true).marker
    expect(open.className).toContain(OPEN_CLASS)
    expect(open.matches(OPEN_SELECTOR)).toBe(true)
  })

  it('stays a + while closed', () => {
    expect(marker(false).marker.matches(OPEN_SELECTOR)).toBe(false)
  })

  it('never targets panel content inside an open disclosure', () => {
    const { container } = marker(true)
    expect(container.querySelector('details > div p')!.matches(OPEN_SELECTOR)).toBe(false)
  })

  it('does not rely on a group-open class the summary can never satisfy', () => {
    expect(marker(true).marker.className).not.toContain('group-open:')
  })
})
