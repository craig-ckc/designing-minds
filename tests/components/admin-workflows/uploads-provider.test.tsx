import { act, render, waitFor } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UploadsProvider, useUploadTarget, useUploads, type UploadedArtifact } from '../../../apps/admin/src/lib/uploads'

const artifact: UploadedArtifact = { id: 'file-1', url: 'https://example.test/preview.pdf', storageKey: 'preview.pdf', filename: 'preview.pdf', alt: '' }
const pdf = (name = 'preview.pdf', lastModified = 123) => new File(['%PDF-1.4'], name, { type: 'application/pdf', lastModified })

function StartUpload({ registerTarget = false }: { registerTarget?: boolean }) {
  const { start, jobs } = useUploads()
  const startWith = (options: { collectionId?: string; recordId?: string; fieldKey?: string; purpose?: 'preview' | 'purchased'; replacesFileId?: string; file?: File } = {}) =>
    start({ collectionId: options.collectionId ?? 'products', recordId: options.recordId ?? 'missing', fieldKey: options.fieldKey ?? 'preview', purpose: options.purpose ?? 'preview', replacesFileId: options.replacesFileId, file: options.file ?? pdf() })
  return <>
    <button onClick={() => startWith()}>Start</button>
    <button onClick={() => startWith({ recordId: 'other' })}>Other record</button>
    <button onClick={() => startWith({ collectionId: 'faqs' })}>Other collection</button>
    <button onClick={() => startWith({ fieldKey: 'other' })}>Other field</button>
    <button onClick={() => startWith({ purpose: 'purchased' })}>Other purpose</button>
    <button onClick={() => startWith({ replacesFileId: 'replace-2' })}>Other replacement</button>
    <button onClick={() => startWith({ file: pdf('different.pdf') })}>Other filename</button>
    <button onClick={() => startWith({ file: pdf('preview.pdf', 456) })}>Other modified date</button>
    <button onClick={() => startWith({ file: new File(['%PDF-1.4 longer'], 'preview.pdf', { type: 'application/pdf', lastModified: 123 }) })}>Other size</button>
    <button onClick={() => startWith({ file: new File(['%PDF-1.4'], 'preview.pdf', { type: 'application/x-pdf', lastModified: 123 }) })}>Other MIME type</button>
    {registerTarget ? <TargetRegistration /> : null}
    <output data-testid="jobs">{JSON.stringify(jobs)}</output>
  </>
}

function TargetRegistration() {
  useUploadTarget('products', 'missing', 'preview', vi.fn())
  return null
}

const jobsIn = (getByTestId: (id: string) => HTMLElement) => JSON.parse(getByTestId('jobs').textContent ?? '[]') as Array<{ status: string; error?: string }>

function ClearJobsOnUnmount() {
  const { jobs, dismiss } = useUploads()
  const latest = useRef(jobs)
  latest.current = jobs
  useEffect(() => () => latest.current.forEach((job) => dismiss(job.id)), [dismiss])
  return null
}

function TestUploadsProvider(props: React.ComponentProps<typeof UploadsProvider>) {
  return <UploadsProvider {...props}><ClearJobsOnUnmount />{props.children}</UploadsProvider>
}

describe('UploadsProvider retries and recovery', () => {
  it('reports attachment failure and never reports upload success when the editor is absent', async () => {
    const notify = vi.fn()
    const upload = vi.fn(async (): Promise<UploadedArtifact> => artifact)
    const onOrphaned = vi.fn(async () => { throw new Error('The record no longer exists.') })
    const { getByText } = render(<TestUploadsProvider upload={upload} onOrphaned={onOrphaned} onNotify={notify}><StartUpload /></TestUploadsProvider>)
    await act(async () => { getByText('Start').click() })
    await waitFor(() => expect(notify).toHaveBeenCalledWith('preview.pdf failed to upload. The record no longer exists.', 'error'))
    expect(notify).not.toHaveBeenCalledWith(expect.stringContaining('uploaded.'), 'info')
  })

  it('keeps the detailed storage reason in the global notification when the target is absent', async () => {
    const notify = vi.fn()
    const upload = vi.fn(async () => { throw new Error('Synthetic 503') })
    const { getByText } = render(<TestUploadsProvider upload={upload} onOrphaned={vi.fn(async () => {})} onNotify={notify}><StartUpload /></TestUploadsProvider>)
    await act(async () => { getByText('Start').click() })
    await waitFor(() => expect(notify).toHaveBeenCalledWith('preview.pdf failed to upload. Synthetic 503', 'error'))
  })

  it('replaces each identical failed attempt, then attaches a successful retry to the open field', async () => {
    const notify = vi.fn()
    const attached = vi.fn()
    const upload = vi.fn()
      .mockRejectedValueOnce(new Error('Synthetic 503'))
      .mockRejectedValueOnce(new Error('Synthetic 503'))
      .mockResolvedValue(artifact)
    function OpenField() {
      const { start, jobs } = useUploads()
      useUploadTarget('products', 'missing', 'preview', attached)
      return <><button onClick={() => start({ collectionId: 'products', recordId: 'missing', fieldKey: 'preview', purpose: 'preview', file: pdf() })}>Retry</button><output data-testid="jobs">{JSON.stringify(jobs)}</output></>
    }
    const { getByText, getByTestId } = render(<TestUploadsProvider upload={upload} onOrphaned={vi.fn(async () => {})} onNotify={notify}><OpenField /></TestUploadsProvider>)
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await act(async () => { getByText('Retry').click() })
      await waitFor(() => expect(jobsIn(getByTestId).map((job) => job.status)).toEqual(['error']))
    }
    expect(upload).toHaveBeenCalledTimes(2)
    await act(async () => { getByText('Retry').click() })
    await waitFor(() => expect(attached).toHaveBeenCalledWith(artifact, undefined))
    expect(jobsIn(getByTestId)).toHaveLength(0)
    expect(notify).toHaveBeenCalledWith('preview.pdf failed to upload. See the field for details.', 'error')
    expect(notify).not.toHaveBeenCalledWith(expect.stringContaining('Synthetic 503'), 'error')
  })

  it('keeps simultaneous same-file uploads as separate active jobs', async () => {
    const notify = vi.fn()
    const resolvers: Array<(value: UploadedArtifact) => void> = []
    const upload = vi.fn(() => new Promise<UploadedArtifact>((resolve) => { resolvers.push(resolve) }))
    const { getByText, getByTestId } = render(<TestUploadsProvider upload={upload} onOrphaned={vi.fn(async () => {})} onNotify={notify}><StartUpload registerTarget /></TestUploadsProvider>)
    await act(async () => { getByText('Start').click(); getByText('Start').click() })
    await waitFor(() => expect(jobsIn(getByTestId)).toHaveLength(2))
    expect(jobsIn(getByTestId).every((job) => job.status === 'uploading')).toBe(true)
    await act(async () => { resolvers.forEach((resolve) => resolve(artifact)) })
  })

  it('coalesces every failed duplicate from parallel uploads when the file is retried', async () => {
    const notify = vi.fn()
    const rejectors: Array<(error: Error) => void> = []
    const upload = vi.fn(() => new Promise<UploadedArtifact>((_resolve, reject) => { rejectors.push(reject) }))
    const { getByText, getByTestId } = render(<TestUploadsProvider upload={upload} onOrphaned={vi.fn(async () => {})} onNotify={notify}><StartUpload registerTarget /></TestUploadsProvider>)
    await act(async () => { getByText('Start').click(); getByText('Start').click() })
    await waitFor(() => expect(jobsIn(getByTestId)).toHaveLength(2))
    await act(async () => { rejectors.forEach((reject) => reject(new Error('Synthetic 503'))) })
    await waitFor(() => expect(jobsIn(getByTestId).every((job) => job.status === 'error')).toBe(true))
    await act(async () => { getByText('Start').click() })
    await waitFor(() => expect(jobsIn(getByTestId)).toHaveLength(1))
    expect(jobsIn(getByTestId)[0].status).toBe('uploading')
  })

  it('does not coalesce different records, fields, purposes, replacement IDs, or original file metadata', async () => {
    const notify = vi.fn()
    const upload = vi.fn(async () => { throw new Error('Synthetic 503') })
    const { getByText, getByTestId } = render(<TestUploadsProvider upload={upload} onOrphaned={vi.fn(async () => {})} onNotify={notify}><StartUpload /></TestUploadsProvider>)
    await act(async () => { getByText('Start').click() })
    await waitFor(() => expect(jobsIn(getByTestId)).toHaveLength(1))
    for (const label of ['Other record', 'Other collection', 'Other field', 'Other purpose', 'Other replacement', 'Other filename', 'Other modified date', 'Other size', 'Other MIME type']) {
      await act(async () => { getByText(label).click() })
    }
    await waitFor(() => expect(jobsIn(getByTestId)).toHaveLength(10))
  })

  it('coalesces repeated rejected-file attempts and keeps the detailed reason in the open field', async () => {
    const notify = vi.fn()
    const upload = vi.fn()
    function OpenField() {
      const { start, jobs } = useUploads()
      useUploadTarget('products', 'missing', 'preview', vi.fn())
      return <><button onClick={() => start({ collectionId: 'products', recordId: 'missing', fieldKey: 'preview', purpose: 'preview', file: new File(['bad'], 'broken.txt', { type: 'text/plain', lastModified: 123 }) })}>Reject</button><output data-testid="jobs">{JSON.stringify(jobs)}</output></>
    }
    const { getByText, getByTestId } = render(<TestUploadsProvider upload={upload} onOrphaned={vi.fn(async () => {})} onNotify={notify}><OpenField /></TestUploadsProvider>)
    await act(async () => { getByText('Reject').click(); getByText('Reject').click() })
    expect(jobsIn(getByTestId)).toHaveLength(1)
    expect(jobsIn(getByTestId)[0].status).toBe('error')
    expect(upload).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith('broken.txt was not uploaded. See the field for details.', 'error')
  })
})
