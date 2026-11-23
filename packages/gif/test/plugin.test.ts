import { decode } from 'modern-gif'
import { expect, it, vi } from 'vitest'
import { plugin } from '../src/plugin'

vi.mock('mce', () => ({ definePlugin: (factory: unknown) => factory }))

it.each([undefined, true, false])('writes the selected GIF loop setting (%s) with both frames intact', async (looped) => {
  const exporter = (plugin() as any)({
    to: () => ({ style: { width: 2, height: 2 } }),
    renderFrames: async ({ onFrame }: Mce.RenderFramesOptions) => {
      for (const progress of [0.5, 1])
        await onFrame(new Uint8ClampedArray(16).fill(Math.round(progress * 255)), { duration: 100, progress })
    },
  }, {}).exporters[0]
  const blob = await exporter.handle(looped === undefined ? {} : { gif: { looped } })
  const parsed = decode(await blob.arrayBuffer())
  expect(parsed.frames).toHaveLength(2)
  expect(Boolean(parsed.looped)).toBe(looped ?? true)
})
