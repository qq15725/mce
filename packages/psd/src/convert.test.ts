import { describe, expect, it } from 'vitest'
import { psdToFrame } from './convert'

function layer(name: string, x: number, y: number, w: number, h: number, extra: any = {}): any {
  return { name, left: x, top: y, right: x + w, bottom: y + h, canvas: { width: w, height: h }, ...extra }
}

const resolve = async (_canvas: any, l: any): Promise<string> => `url:${l.name}`

describe('psdToFrame', () => {
  it('展平图层为图片元素并包进 Frame', async () => {
    const psd = { width: 400, height: 300, children: [layer('Red', 20, 30, 100, 80)] }
    const frame = await psdToFrame(psd as any, resolve)
    expect(frame.meta.inEditorIs).toBe('Frame')
    expect(frame.style).toMatchObject({ width: 400, height: 300, left: 0, top: 0 })
    expect(frame.children).toHaveLength(1)
    expect(frame.children[0]).toMatchObject({
      name: 'Red',
      foreground: 'url:Red',
      style: { left: 20, top: 30, width: 100, height: 80, opacity: 1 },
    })
  })

  it('递归展平组（用绝对坐标），跳过隐藏图层', async () => {
    const psd = {
      width: 400,
      height: 300,
      children: [
        layer('Red', 0, 0, 50, 50),
        { name: 'Group', children: [layer('Blue', 200, 150, 60, 40)] },
        layer('Hidden', 0, 0, 50, 50, { hidden: true }),
      ],
    }
    const frame = await psdToFrame(psd as any, resolve)
    expect(frame.children.map((c: any) => c.name)).toEqual(['Red', 'Blue'])
    expect(frame.children[1].style).toMatchObject({ left: 200, top: 150, width: 60, height: 40 })
  })

  it('opacity 透传（ag-psd 0..1），缺省视为 1', async () => {
    const psd = { width: 100, height: 100, children: [layer('A', 0, 0, 10, 10, { opacity: 0.5 }), layer('B', 0, 0, 10, 10)] }
    const frame = await psdToFrame(psd as any, resolve)
    expect(frame.children[0].style.opacity).toBe(0.5)
    expect(frame.children[1].style.opacity).toBe(1)
  })

  it('跳过无位图 / 零尺寸图层', async () => {
    const psd = { width: 100, height: 100, children: [
      { name: 'NoCanvas', left: 0, top: 0 },
      { name: 'Zero', left: 0, top: 0, canvas: { width: 0, height: 0 } },
      layer('Ok', 0, 0, 10, 10),
    ] }
    const frame = await psdToFrame(psd as any, resolve)
    expect(frame.children.map((c: any) => c.name)).toEqual(['Ok'])
  })
})
