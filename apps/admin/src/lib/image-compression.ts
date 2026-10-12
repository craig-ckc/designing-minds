import { UploadAbortedError, type UploadPurpose } from './upload-transport.ts'

export function needsImageCompression(file: File, purpose: UploadPurpose): boolean {
  return purpose === 'gallery' && file.type.toLowerCase() !== 'image/avif' && !/\.avif$/i.test(file.name)
}

/** Convert locally before reserving storage. PDFs, ZIPs and existing AVIFs pass through. */
export async function prepareUpload(file: File, purpose: UploadPurpose, signal: AbortSignal): Promise<File> {
  if (signal.aborted) throw new UploadAbortedError()
  if (!needsImageCompression(file, purpose)) return file

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./image-compression.worker.ts', import.meta.url), { type: 'module' })
    const cleanup = () => {
      signal.removeEventListener('abort', abort)
      worker.terminate()
    }
    const abort = () => {
      cleanup()
      reject(new UploadAbortedError())
    }
    signal.addEventListener('abort', abort, { once: true })
    worker.onmessage = (event: MessageEvent<{ bytes?: ArrayBuffer; error?: string }>) => {
      cleanup()
      if (event.data.error || !event.data.bytes?.byteLength) {
        reject(new Error(event.data.error ?? 'Could not compress this image to AVIF. Nothing was uploaded.'))
        return
      }
      const name = `${file.name.replace(/\.[^.]+$/, '') || 'image'}.avif`
      resolve(new File([event.data.bytes], name, { type: 'image/avif', lastModified: file.lastModified }))
    }
    worker.onerror = (event) => {
      event.preventDefault()
      cleanup()
      reject(new Error('Could not compress this image to AVIF. Try again in a current browser. Nothing was uploaded.'))
    }
    worker.postMessage(file)
  })
}
