// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import Transform from './Transform.vue'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach(fn => fn()))

async function rotate(angle: number, modifiers: { shiftKey?: boolean, altKey?: boolean } = {}) {
  const value = ref({ left: 0, top: 0, width: 200, height: 100, rotate: 0 })
  const container = document.createElement('div')
  document.body.append(container)
  const app = createApp({ render: () => h(Transform, {
    'modelValue': value.value,
    'onUpdate:modelValue': next => value.value = next as typeof value.value,
  }) })
  app.mount(container)
  cleanup.push(() => {
    app.unmount()
    container.remove()
  })
  const handle = container.querySelector('.m-transform__handle-rect[aria-label="rotate-tl"]')!
  const x = Number(handle.getAttribute('x')) + Number(handle.getAttribute('width')) / 2
  const y = Number(handle.getAttribute('y')) + Number(handle.getAttribute('height')) / 2
  handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, ...modifiers }))
  const rad = angle * Math.PI / 180
  document.dispatchEvent(new PointerEvent('pointermove', {
    clientX: 100 + (x - 100) * Math.cos(rad) - (y - 50) * Math.sin(rad),
    clientY: 50 + (x - 100) * Math.sin(rad) + (y - 50) * Math.cos(rad),
    ...modifiers,
  }))
  await nextTick()
  document.dispatchEvent(new PointerEvent('pointerup'))
  return (value.value.rotate % 360 + 360) % 360
}

describe('旋转手柄', () => {
  it('按住 Shift 靠近四个直角时吸附', async () => {
    for (const angle of [90, 180, 270, 360]) {
      expect(await rotate(angle - 3, { shiftKey: true })).toBeCloseTo(angle % 360)
      expect(await rotate(angle + 3, { shiftKey: true })).toBeCloseTo(angle % 360)
    }
  })

  it('离开吸附范围仍可自由旋转，Alt 临时取消吸附', async () => {
    expect(await rotate(33, { shiftKey: true })).toBeCloseTo(33)
    expect(await rotate(43, { shiftKey: true })).toBeCloseTo(43)
    expect(await rotate(87, { shiftKey: true, altKey: true })).toBeCloseTo(87)
    expect(await rotate(43)).toBeCloseTo(45)
  })
})
