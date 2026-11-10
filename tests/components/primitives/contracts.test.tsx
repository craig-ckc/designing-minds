import { createRef } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Button as WebButton } from '../../../apps/web/src/components/ui/button'
import { Button } from '../../../apps/admin/src/components/primitives/Button'
import { Input } from '../../../apps/admin/src/components/primitives/Input'
import { Textarea } from '../../../apps/admin/src/components/primitives/Textarea'
import { RichTextEditor } from '../../../apps/admin/src/components/editor/RichTextEditor'

describe('public button composition', () => {
  it('preserves consumer ARIA state on links and native buttons', () => {
    render(<MemoryRouter>
      <WebButton to="/shop" aria-disabled="true" aria-busy="true">Shop</WebButton>
      <WebButton aria-busy="true">Save</WebButton>
    </MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Shop' }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('link', { name: 'Shop' }).getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('aria-busy')).toBe('true')
  })

  it('keeps the label and blocks activation during a link handoff', () => {
    const click = vi.fn()
    render(<MemoryRouter><WebButton to="/shop" loading onClick={click}>Continue shopping</WebButton></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Continue shopping' })
    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(fireEvent.click(link)).toBe(false)
    expect(click).not.toHaveBeenCalled()
  })
})

describe('admin primitive contracts', () => {
  it('forwards refs and consumer events to the actual controls', () => {
    const buttonRef = createRef<HTMLButtonElement>()
    const inputRef = createRef<HTMLInputElement>()
    const textareaRef = createRef<HTMLTextAreaElement>()
    const change = vi.fn()
    render(<>
      <Button ref={buttonRef}>Save</Button>
      <Input ref={inputRef} aria-label="Title" onChange={change} />
      <Textarea ref={textareaRef} aria-label="Notes" />
    </>)
    expect(buttonRef.current).toBe(screen.getByRole('button', { name: 'Save' }))
    expect(inputRef.current).toBe(screen.getByRole('textbox', { name: 'Title' }))
    expect(textareaRef.current).toBe(screen.getByRole('textbox', { name: 'Notes' }))
    fireEvent.change(inputRef.current!, { target: { value: 'New title' } })
    expect(change).toHaveBeenCalledOnce()
  })

  it('names the rich-text surface and exposes read-only state', async () => {
    render(<>
      <span id="description-label">Description</span>
      <RichTextEditor id="description" aria-labelledby="description-label" value="Existing text" disabled onChange={vi.fn()} />
    </>)
    const editor = await screen.findByRole('textbox', { name: 'Description' })
    expect(editor.getAttribute('aria-readonly')).toBe('true')
    expect(editor.getAttribute('contenteditable')).toBe('false')
  })

  it('follows an externally refreshed field value without reporting a user edit', async () => {
    const change = vi.fn()
    const field = (value: string) => <>
      <span id="description-label">Description</span>
      <RichTextEditor id="description" aria-labelledby="description-label" value={value} onChange={change} />
    </>
    const { rerender } = render(field('Original description'))
    const editor = await screen.findByRole('textbox', { name: 'Description' })
    rerender(field('Refreshed description'))
    await waitFor(() => expect(editor.textContent).toBe('Refreshed description'))
    expect(change).not.toHaveBeenCalled()
  })
})
