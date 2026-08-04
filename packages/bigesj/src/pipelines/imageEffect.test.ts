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

// 主体内缩的几何：来源编辑器 createEffects 固定 `ctx.scale(0.9)` 居中，迁移过来的作品必须一致。
// 元素框互相重叠、靠内缩留白制造缝隙的排版（如节气海报九宫格）对边距极敏感，边距一少就互相压盖。
describe('bakeImageEffects 主体内缩', () => {
  afterEach(() => {
    setCanvasFactory(undefined)
    created.length = 0
  })

  /** 取内缩用的那次 drawImage 参数（第一个建出来的 canvas 即 inset）：[x, y, w, h] */
  function insetRect(effects: any[], w: number, h: number): number[] {
    setCanvasFactory(recordingCanvas)
    created.length = 0
    bakeImageEffects({ width: w, height: h } as any, effects, w, h)
    return drawImagesOf(created[0])[0].a.slice(1)
  }

  it('默认缩到 0.9 并居中，边距按元素尺寸各留 5%', () => {
    expect(insetRect([{ outline: { color: '#fff', width: 10 } }], 400, 800))
      .toEqual([20, 40, 360, 720])
  })

  it('宽高不等的元素等比内缩，不改变纵横比', () => {
    const [, , w, h] = insetRect([{ outline: { color: '#fff', width: 10 } }], 389, 691)
    expect(w / h).toBeCloseTo(389 / 691, 4)
  })

  it('描边宽到 5% 装不下时按需再缩', () => {
    // 100×100 上 20px 描边：0.9 只留 5px，得缩到 1 - 2*0.2 = 0.6
    expect(insetRect([{ outline: { color: '#fff', width: 20 } }], 100, 100))
      .toEqual([20, 20, 60, 60])
  })

  it('内缩不低于下限，主体不会被缩没', () => {
    const [, , w, h] = insetRect([{ outline: { color: '#fff', width: 90 } }], 100, 100)
    expect(w).toBe(60)
    expect(h).toBe(60)
  })

  it('无描边 / 无位移时不内缩', () => {
    setCanvasFactory(recordingCanvas)
    created.length = 0
    const out = bakeImageEffects({ width: 100, height: 100 } as any, [{}], 100, 100)
    // 只建了 out 一张画布，主图原尺寸直接合成
    expect(created.length).toBe(1)
    expect(drawImagesOf(out)[0].a.slice(1)).toEqual([0, 0, 100, 100])
  })
})
