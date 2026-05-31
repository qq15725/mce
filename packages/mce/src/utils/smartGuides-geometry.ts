// 智能参考线的纯几何类型与函数（不依赖 editor / Vue 组件）。
// 抽出来主要为了：
//   1) 让单测可直接 import（避免被 SmartGuides.vue 的组件依赖链拖入循环导入）；
//   2) 为 P1.4 拆 smartGuides.ts 大文件铺路。
import { Aabb2D } from 'modern-canvas'

export type LineType = 'vt' | 'vm' | 'vb' | 'hl' | 'hm' | 'hr'

export interface Line {
  pos: number
  type: LineType
  box?: Box
}

export interface Box {
  id: number | string
  vt: Line
  vm: Line
  vb: Line
  hl: Line
  hm: Line
  hr: Line
}

export type LinePairType = 'distance' | 'alignment' | 'spacing' | 'area'

export interface LinePair {
  source: Line
  target: Line
  type: LinePairType
  distance: number
  _ctx?: Record<string, any>
}

export interface BoundingBox {
  left: number
  top: number
  width: number
  height: number
  rotate?: number
}

export function createLine(pos: number, type: LineType, box?: Box): Line {
  return { pos, type, box }
}

export function toBoundingBox(value: Line | Box): Aabb2D {
  const box = ('box' in value ? value.box : value) as Box
  return new Aabb2D({
    x: box.hl.pos,
    y: box.vt.pos,
    width: box.hr.pos - box.hl.pos,
    height: box.vb.pos - box.vt.pos,
  })
}

export function flipType(type: string): LineType {
  if (type === 'vt')
    return 'vb'
  if (type === 'vb')
    return 'vt'
  if (type === 'hl')
    return 'hr'
  if (type === 'hr')
    return 'hl'
  return type as LineType
}

export function isLeftTopLine(line: Line): boolean {
  return ['vt', 'hl'].includes(line.type)
}

// 距离线：从移动盒子中线出发，到「同向有重叠、之间有正间距」的最近兄弟盒子，每轴最多 1 条。
// 不含画板边界（id=-1，容器是包含关系非相邻间距）。
export function findDistancePairs(box: Box, boxes: Box[]): LinePair[] {
  const moving = toBoundingBox(box)
  let bestV: { gap: number, below: boolean, nb: Box } | undefined
  let bestH: { gap: number, after: boolean, nb: Box } | undefined
  for (const nb of boxes) {
    if (nb.id === -1)
      continue
    const b = toBoundingBox(nb)
    if (moving.overlap(b, 'x')) {
      const below = nb.vt.pos - box.vb.pos
      const above = box.vt.pos - nb.vb.pos
      if (below > 0 && (!bestV || below < bestV.gap))
        bestV = { gap: below, below: true, nb }
      if (above > 0 && (!bestV || above < bestV.gap))
        bestV = { gap: above, below: false, nb }
    }
    if (moving.overlap(b, 'y')) {
      const after = nb.hl.pos - box.hr.pos
      const before = box.hl.pos - nb.hr.pos
      if (after > 0 && (!bestH || after < bestH.gap))
        bestH = { gap: after, after: true, nb }
      if (before > 0 && (!bestH || before < bestH.gap))
        bestH = { gap: before, after: false, nb }
    }
  }
  const pairs: LinePair[] = []
  if (bestV) {
    pairs.push({
      source: bestV.below ? box.vb : box.vt,
      target: bestV.below ? bestV.nb.vt : bestV.nb.vb,
      type: 'distance',
      distance: bestV.gap,
    })
  }
  if (bestH) {
    pairs.push({
      source: bestH.after ? box.hr : box.hl,
      target: bestH.after ? bestH.nb.hl : bestH.nb.hr,
      type: 'distance',
      distance: bestH.gap,
    })
  }
  return pairs
}
