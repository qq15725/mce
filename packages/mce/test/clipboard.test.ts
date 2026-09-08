// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import editPlugin from '../src/plugins/edit'

vi.mock('../src/utils', () => ({ isInputEvent: () => false, SUPPORTS_CLIPBOARD: false }))
vi.mock('modern-text', () => ({
  measureText: () => ({ boundingBox: { width: 300, height: 50 } }),
}))

function setup(options = {}) {
  const addElements = vi.fn()
  const load = vi.fn(async () => [])
  const canLoad = vi.fn(async (source: any) => source instanceof Blob)
  const editor = {
    frames: ref([]), selection: ref([]), addElements, load, canLoad, fonts: {},
    state: ref(), hoverElement: ref(), renderEngine: ref(), exec: vi.fn(),
  }
  const plugin = (editPlugin as any)(editor, options)
  const paste = plugin.commands.find((c: any) => c.command === 'paste').handle
  return { paste, addElements, load, canLoad }
}

function clipboard(data: Record<string, string>) {
  return [{ types: Object.keys(data), getType: async (type: string) => new Blob([data[type]], { type }) }]
}

describe('外部文字粘贴', () => {
  it('外部 HTML 回退纯文字，并应用当前缩放和主题样式', async () => {
    let zoom = 0.1
    const { paste, addElements, load } = setup({
      clipboardTextStyle: () => ({ fontSize: 18 / zoom, color: '@on-surface' }),
    })
    await paste(clipboard({ 'text/html': '<p>外部文字</p>', 'text/plain': '外部文字' }))
    expect(load).not.toHaveBeenCalled()
    expect(addElements.mock.calls[0][0][0]).toMatchObject({ style: { fontSize: 180, color: '@on-surface' } })
    zoom = 0.5
    await paste(clipboard({ 'text/plain': '再次粘贴' }))
    expect(addElements.mock.calls[1][0][0].style.fontSize).toBe(36)
  })

  it('内部复制的元素保留自定义颜色和尺寸', async () => {
    const { paste, addElements, load, canLoad } = setup({
      clipboardTextStyle: () => ({ fontSize: 180, color: '@on-surface' }),
    })
    const original = { style: { fontSize: 42, color: '#123456', width: 600 } }
    canLoad.mockResolvedValue(true)
    load.mockResolvedValue([original] as any)
    await paste(clipboard({ 'text/html': '<mce-clipboard>[]</mce-clipboard>', 'text/plain': '内部文字' }))
    expect(addElements.mock.calls[0][0]).toEqual([original])
  })

  it('未设置宿主样式时仍使用原有 loader，空 HTML 结果不会吞掉纯文字', async () => {
    const { paste, addElements, load } = setup()
    const original = { style: { fontSize: 45 } }
    load.mockResolvedValueOnce([]).mockResolvedValueOnce([original] as any)
    await paste(clipboard({ 'text/html': '<p>文字</p>', 'text/plain': '文字' }))
    expect(addElements.mock.calls[0][0]).toEqual([original])
  })
})
