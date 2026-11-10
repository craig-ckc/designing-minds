import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DeferredRichTextEditor } from '../../../apps/admin/src/components/editor/DeferredRichTextEditor'
import type { RichTextEditor } from '../../../apps/admin/src/components/editor/RichTextEditor'

const TextEditor: typeof RichTextEditor = (props) => <textarea id={props.id} aria-labelledby={props['aria-labelledby']}
  value={props.value} onChange={(event) => props.onChange(event.target.value)} disabled={props.disabled} />

it('loads the formatting module without changing the controlled value', async () => {
  const change = vi.fn()
  render(<><span id="description-label">Description</span><DeferredRichTextEditor id="description"
    aria-labelledby="description-label" value="Existing **description**" onChange={change} load={async () => TextEditor} /></>)
  expect(screen.getByRole('status').textContent).toBe('Loading editor…')
  const editor = await screen.findByRole('textbox', { name: 'Description' })
  expect((editor as HTMLTextAreaElement).value).toBe('Existing **description**')
  expect(change).not.toHaveBeenCalled()
})

it('keeps the field editable after a failed load and preserves new text on retry', async () => {
  const load = vi.fn<() => Promise<typeof RichTextEditor>>()
    .mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(TextEditor)
  function Draft() {
    const [value, setValue] = useState('Original')
    return <><span id="description-label">Description</span><DeferredRichTextEditor id="description"
      aria-labelledby="description-label" value={value} onChange={setValue} load={load} /></>
  }
  render(<Draft />)
  const fallback = await screen.findByRole('textbox', { name: 'Description' })
  expect(screen.getByRole('status').textContent).toContain('could not load')
  fireEvent.change(fallback, { target: { value: 'Saved in the **draft**' } })
  fireEvent.click(screen.getByRole('button', { name: 'Retry formatted editor' }))
  const editor = await screen.findByRole('textbox', { name: 'Description' })
  expect((editor as HTMLTextAreaElement).value).toBe('Saved in the **draft**')
  expect(load).toHaveBeenCalledTimes(2)
})
