import { describe, expect, it, vi } from 'vitest'
import scrollPlugin from './scroll'

vi.mock('../components/Scrollbars.vue', () => ({ default: {} }))

function fixture(visible = false) {
  const position = { x: 10, y: 20, set: vi.fn() }
  const zoom = { x: 0.5, y: 0.5, set: vi.fn() }
  const bounds = { left: 2000, top: 1000, width: 4000, height: 2000 }
  const getAabb = vi.fn(() => bounds)
  const plugin = (scrollPlugin as any)({
    registerConfig: () => ({ value: { visible: true } }),
    camera: { value: { position, zoom } },
    getAabb,
    selectionAabb: { value: bounds },
    rootAabb: { value: bounds },
    viewportAabb: { value: { contains: () => visible } },
    screenCenter: { value: { x: 400, y: 300 } },
    screenCenterOffset: { value: { left: 20, top: 30 } },
  }, {})
  return { position, zoom, getAabb, scroll: plugin.commands.find((c: any) => c.command === 'scrollTo').handle }
}

describe('滚动到新元素保持缩放', () => {
  it('元素数组按包围盒定位，超大元素也不缩放', async () => {
    const f = fixture()
    const nodes = [{ id: 'a' }, { id: 'b' }]
    await f.scroll(nodes, { intoView: true })
    expect(f.getAabb).toHaveBeenCalledWith(nodes)
    expect(f.position.set).toHaveBeenCalledWith(1600, 700)
    expect(f.zoom.set).not.toHaveBeenCalled()
  })
  it('元素已经可见时保持相机不动', async () => {
    const f = fixture(true)
    await f.scroll([{ id: 'a' }], { intoView: true })
    expect(f.position.set).not.toHaveBeenCalled()
    expect(f.zoom.set).not.toHaveBeenCalled()
  })
  it('坐标定位仍保留屏幕边距和未指定轴', async () => {
    const f = fixture()
    await f.scroll({ x: 1000 })
    expect(f.position.set).toHaveBeenCalledWith(480, 20)
    expect(f.zoom.set).not.toHaveBeenCalled()
  })
})
