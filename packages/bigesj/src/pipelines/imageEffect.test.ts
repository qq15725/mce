import { setCanvasFactory } from 'modern-canvas'
import { afterEach, describe, expect, it } from 'vitest'
import { bakeImageEffects } from './imageEffect'

// 用记录型 2D context 验证合成不变量（无需真实像素）：
// - 每个 effect 层都以 destination-over 合成（数组前→后堆叠，位移层落到背后形成阴影/重影）
// - translate 决定该层落点

const created: any[] = []

function recordingCanvas(width = 0, height = 0): any {
  const ops: any[] = []
  const ctx: any = {
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    save() {},
    restore() {},
    drawImage(...a: any[]) { ops.push({ m: 'drawImage', gco: this.globalCompositeOperation, a }) },
    fillRect(...a: any[]) { ops.push({ m: 'fillRect', gco: this.globalCompositeOperation, a }) },
    createLinearGradient() { return { addColorStop() {} } },
  }
  const canvas: any = { width, height, getContext: () => ctx, _ops: ops }
  created.push(canvas)
  return canvas
}

function drawImagesOf(canvas: any): any[] {
  return canvas._ops.filter((o: any) => o.m === 'drawImage')
}

describe('bakeImageEffects compositing', () => {
  afterEach(() => {
    setCanvasFactory(undefined)
    created.length = 0
  })

  function bake(effects: any[]): any {
    setCanvasFactory(recordingCanvas)
    const source: any = { width: 100, height: 100 }
    // 直接用返回值：含描边/位移时会先建 inset canvas 内缩主体留边距，created[0] 不再是 out
    return bakeImageEffects(source, effects, 100, 100)
  }

  it('每层都以 destination-over 合成', () => {
    const out = bake([
      {}, // 主图
      { fill: { color: '#000000' }, transform: 'translate(20, 20)' }, // 位移阴影
    ])
    const draws = drawImagesOf(out)
    expect(draws.length).toBe(2)
    expect(draws.every(d => d.gco === 'destination-over')).toBe(true)
  })

  it('数组前→后堆叠：主图先画、位移层落到其后', () => {
    const out = bake([
      {},
      { fill: { color: '#000000' }, transform: 'translate(20, 30)' },
    ])
    const draws = drawImagesOf(out)
    // 第 0 层（主图）落点 0,0
    expect(draws[0].a.slice(1)).toEqual([0, 0, 100, 100])
    // 第 1 层（阴影）落点为 translate 解析出的偏移，且 destination-over → 在主图之后
    expect(draws[1].a.slice(1)).toEqual([20, 30, 100, 100])
    expect(draws[1].gco).toBe('destination-over')
  })

  it('纯描边层也以 destination-over 合成于落点 0,0', () => {
    const out = bake([{ outline: { color: '#ff0000', width: 8 } }])
    const draws = drawImagesOf(out)
    expect(draws.length).toBe(1)
    expect(draws[0].gco).toBe('destination-over')
    expect(draws[0].a.slice(1)).toEqual([0, 0, 100, 100])
  })
})
