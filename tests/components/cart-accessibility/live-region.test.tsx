import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveRegionProvider, useAnnounce } from '../../../apps/web/src/components/ui/live-region'

function Controls() {
  const announce = useAnnounce()
  return <>
    <button onClick={() => announce('First update')}>Announce first</button>
    <button onClick={() => announce('Second update')}>Announce second</button>
    <button onClick={() => announce('Urgent update', { politeness: 'assertive' })}>Announce urgent</button>
  </>
}

describe('live region timer lifecycle', () => {
  beforeEach(() => vi.useFakeTimers())

  it('replaces pending timers per channel so an older message cannot clear a newer one', () => {
    render(<LiveRegionProvider><Controls /></LiveRegionProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Announce first' }))
    act(() => { vi.advanceTimersByTime(50) })
    expect(screen.getByRole('status').textContent).toBe('First update')

    act(() => { vi.advanceTimersByTime(50) })
    fireEvent.click(screen.getByRole('button', { name: 'Announce second' }))
    act(() => { vi.advanceTimersByTime(50) })
    expect(screen.getByRole('status').textContent).toBe('Second update')

    act(() => { vi.advanceTimersByTime(5900) })
    expect(screen.getByRole('status').textContent).toBe('Second update')
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('keeps polite and assertive timers independent and clears pending timers on unmount', () => {
    const view = render(<LiveRegionProvider><Controls /></LiveRegionProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Announce first' }))
    fireEvent.click(screen.getByRole('button', { name: 'Announce urgent' }))
    act(() => { vi.advanceTimersByTime(50) })
    expect(screen.getByRole('status').textContent).toBe('First update')
    expect(screen.getByRole('alert').textContent).toBe('Urgent update')
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
