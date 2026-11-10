import { describe, expect, it } from 'vitest'
import { enqueueSerial } from '../../../apps/admin/src/lib/serial-queue'

describe('orphan attachment queue', () => {
  it('applies consecutive attachments against the latest saved value', async () => {
    const queue = { current: Promise.resolve() }
    let saved: string[] = []
    const attach = (name: string) => enqueueSerial(queue, async () => {
      const next = [...saved, name]
      await Promise.resolve()
      saved = next
    })
    await Promise.all([attach('first.png'), attach('second.png')])
    expect(saved).toEqual(['first.png', 'second.png'])
  })
})
