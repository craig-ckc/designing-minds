import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { needsImageCompression, prepareUpload } from '../../apps/admin/src/lib/image-compression.ts'
import { UploadAbortedError } from '../../apps/admin/src/lib/upload-transport.ts'

class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  terminated = false
  file?: File
  constructor() { FakeWorker.instances.push(this) }
  postMessage(file: File) { this.file = file }
  terminate() { this.terminated = true }
  reply(data: unknown) { this.onmessage?.({ data } as MessageEvent) }
}

test('upload preparation converts only gallery images and passes other files through', async () => {
  const signal = new AbortController().signal
  for (const [name, type, purpose] of [
    ['lesson.pdf', 'application/pdf', 'preview'],
    ['lesson.zip', 'application/zip', 'purchased'],
    ['cover.avif', 'image/avif', 'gallery'],
    ['cover.AVIF', '', 'gallery'],
  ] as const) {
    const file = new File(['original'], name, { type })
    assert.equal(needsImageCompression(file, purpose), false)
    assert.equal(await prepareUpload(file, purpose, signal), file)
  }
  for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
    assert.equal(needsImageCompression(new File(['image'], 'cover', { type }), 'gallery'), true)
  }
})

test('converted bytes, AVIF metadata and filenames are handed to the existing uploader', async () => {
  const originalWorker = globalThis.Worker
  globalThis.Worker = FakeWorker as unknown as typeof Worker
  try {
    for (const name of ['my.cover.PNG', 'cover', '.png']) {
      const original = new File(['original'], name, { type: 'image/png', lastModified: 123 })
      const pending = prepareUpload(original, 'gallery', new AbortController().signal)
      const worker = FakeWorker.instances.at(-1)!
      assert.equal(worker.file, original)
      worker.reply({ bytes: new Uint8Array([1, 2, 3]).buffer })
      const result = await pending
      assert.equal(result.type, 'image/avif')
      assert.equal(result.name, name === 'my.cover.PNG' ? 'my.cover.avif' : name === '.png' ? 'image.avif' : 'cover.avif')
      assert.equal(result.size, 3)
      assert.equal(result.lastModified, 123)
      assert.deepEqual(new Uint8Array(await result.arrayBuffer()), new Uint8Array([1, 2, 3]))
      assert.equal(worker.terminated, true)
    }
  } finally { globalThis.Worker = originalWorker }
})

test('cancelling before or during compression rejects without retaining a worker', async () => {
  const originalWorker = globalThis.Worker
  globalThis.Worker = FakeWorker as unknown as typeof Worker
  try {
    const file = new File(['image'], 'cover.png', { type: 'image/png' })
    const controller = new AbortController()
    const pending = prepareUpload(file, 'gallery', controller.signal)
    const worker = FakeWorker.instances.at(-1)!
    controller.abort()
    await assert.rejects(pending, UploadAbortedError)
    assert.equal(worker.terminated, true)
    const count = FakeWorker.instances.length
    await assert.rejects(prepareUpload(file, 'gallery', controller.signal), UploadAbortedError)
    assert.equal(FakeWorker.instances.length, count)
  } finally { globalThis.Worker = originalWorker }
})

test('invalid images, empty encoder output and worker failures stop preparation', async () => {
  const originalWorker = globalThis.Worker
  globalThis.Worker = FakeWorker as unknown as typeof Worker
  try {
    const file = new File(['invalid'], 'cover.png', { type: 'image/png' })
    for (const response of [{ error: 'Unreadable image. Nothing was uploaded.' }, { bytes: new ArrayBuffer(0) }]) {
      const pending = prepareUpload(file, 'gallery', new AbortController().signal)
      const worker = FakeWorker.instances.at(-1)!
      worker.reply(response)
      await assert.rejects(pending, /Nothing was uploaded/)
      assert.equal(worker.terminated, true)
    }
    const pending = prepareUpload(file, 'gallery', new AbortController().signal)
    const worker = FakeWorker.instances.at(-1)!
    worker.onerror?.({ preventDefault() {} } as ErrorEvent)
    await assert.rejects(pending, /current browser/)
    assert.equal(worker.terminated, true)
  } finally { globalThis.Worker = originalWorker }
})

test('the background queue prepares and validates the result before requesting an upload', () => {
  const source = readFileSync(new URL('../../apps/admin/src/lib/uploads.tsx', import.meta.url), 'utf8')
  assert.ok(source.indexOf('await prepareUpload(') < source.indexOf('await live.current.upload('))
  assert.ok(source.indexOf('rejectUpload(input.purpose, prepared)') < source.indexOf('await live.current.upload('))
  assert.match(source, /input.recordId,\s+prepared,\s+input.purpose,/)
  assert.match(source, /sizeBytes: prepared.size/)
})
