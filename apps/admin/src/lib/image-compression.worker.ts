import createEncoder from '@jsquash/avif/codec/enc/avif_enc.js'
import encoderWasmUrl from '@jsquash/avif/codec/enc/avif_enc.wasm?url'
import { defaultOptions } from '@jsquash/avif/meta.js'

// The single-thread codec runs inside our worker: no isolation headers or nested
// workers are needed. Import the WASM URL explicitly so Vite includes it in builds.
const encoder = () => createEncoder({ locateFile: () => encoderWasmUrl })

self.onmessage = async (event: MessageEvent<File>) => {
  let bitmap: ImageBitmap | undefined
  try {
    // Gallery previews are still images; animated inputs use their first frame.
    bitmap = await createImageBitmap(event.data)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not read this image.')
    context.drawImage(bitmap, 0, 0)
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const module = await encoder()
    // Full resolution, 4:4:4 colour and lossless alpha keep worksheet text and
    // transparent artwork clear. Quality 65 balances detail with payload size.
    const output = module.encode(pixels.data, bitmap.width, bitmap.height, {
      ...defaultOptions, quality: 65, qualityAlpha: 100, subsample: 3, speed: 6,
    })
    if (!output?.byteLength) throw new Error('Could not encode this image.')
    const bytes = output.slice().buffer
    self.postMessage({ bytes }, { transfer: [bytes] })
  } catch {
    self.postMessage({ error: 'Could not compress this image to AVIF. Check that the image opens correctly, then try again. Nothing was uploaded.' })
  } finally {
    bitmap?.close()
  }
}
