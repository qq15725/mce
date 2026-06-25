import type { Element2D } from 'modern-canvas'
import { Path2D, svgPathDataToCommands } from 'modern-path2d'

export interface LineShapeInfo {
  // 'line'  —— 单段直线（M L）
  // 'arrow' —— 锥形实心箭头（getTaperedArrowPath 的 7 顶点闭合多边形，meta 标记）
  kind: 'line' | 'arrow'
}

export interface LinePoint {
  x: number
  y: number
}

// 判定元素是否为可端点编辑的「直线 / 箭头」。
// - 直线：纯几何识别（无填充、单段 M L，兼容 H/V/相对命令），覆盖导入/同步数据；
// - 箭头：锥形实心多边形，带填充、无通用几何签名，靠 meta.inEditorIs==='Arrow' 识别。
export function parseLineShape(el: Element2D): LineShapeInfo | null {
  const paths = (el as any).shape?.paths
  if (!paths || paths.length !== 1) {
    return null
  }

  // 锥形实心箭头（带填充的闭合多边形）。
  if ((el as any).meta?.inEditorIs === 'Arrow') {
    return { kind: 'arrow' }
  }

  // 直线：有填充说明是面状形状，排除。
  if ((el as any).fill?.isValid?.()) {
    return null
  }
  const raw: string = paths[0]?.data ?? ''
  if (!raw) {
    return null
  }
  // 归一化为绝对 M/L：把 H/V、相对命令统一成 L，否则用 H/V 表达的水平/垂直线判不出来。
  const cmds = svgPathDataToCommands(new Path2D(raw).toData()) as any[]
  // 单段直线 = 恰好 [M, L]，无曲线/闭合。
  if (
    cmds.length === 2
    && cmds[0].type === 'M'
    && cmds[1].type === 'L'
  ) {
    return { kind: 'line' }
  }
  return null
}

// 把元素 path 的所有在线顶点映射到全局坐标（modern-canvas 先把 shape 归一化到 data
// bbox、再缩放到元素尺寸）。供端点 / 宽度提取共用。
function globalVertices(el: Element2D): LinePoint[] | null {
  const paths = (el as any).shape?.paths ?? []
  const cmds = svgPathDataToCommands(new Path2D(paths[0]?.data ?? '').toData()) as any[]
  const pts = cmds.filter(c => 'x' in c && 'y' in c)
  if (!pts.length) {
    return null
  }
  let dx = Infinity
  let dy = Infinity
  let dr = -Infinity
  let db = -Infinity
  for (const p of paths) {
    const bb = new Path2D(p.data).getBoundingBox()
    dx = Math.min(dx, bb.left)
    dy = Math.min(dy, bb.top)
    dr = Math.max(dr, bb.left + bb.width)
    db = Math.max(db, bb.top + bb.height)
  }
  const dbw = dr - dx || 1
  const dbh = db - dy || 1
  const sx = (el as any).size.x || 1
  const sy = (el as any).size.y || 1
  // globalTransform.apply 返回 Vector2（x/y 为原型 getter），拷成普通对象。
  return pts.map((p) => {
    const g = (el as any).globalTransform.apply({ x: (p.x - dx) / dbw * sx, y: (p.y - dy) / dbh * sy })
    return { x: g.x, y: g.y }
  })
}

// 取线/箭头的两个逻辑端点（全局坐标）。直线=前两点；锥形箭头=尾中点 + 尖
// （顶点顺序固定：[尾左, 颈左, 翼左, 尖, 翼右, 颈右, 尾右]）。非线类返回 null。
export function getLineEndpoints(el: Element2D): [LinePoint, LinePoint] | null {
  const info = parseLineShape(el)
  if (!info) {
    return null
  }
  const v = globalVertices(el)
  if (!v) {
    return null
  }
  if (info.kind === 'arrow') {
    if (v.length < 7) {
      return null
    }
    const tail = { x: (v[0].x + v[6].x) / 2, y: (v[0].y + v[6].y) / 2 }
    return [tail, v[3]]
  }
  if (v.length < 2) {
    return null
  }
  return [v[0], v[1]]
}

// 反推锥形箭头的线宽：颈部两顶点间距 = 颈全宽 = 1.4×width（颈半宽 = 0.7×width）。
export function getTaperedArrowWidth(el: Element2D): number {
  const v = globalVertices(el)
  if (!v || v.length < 7) {
    return 6
  }
  return Math.hypot(v[1].x - v[5].x, v[1].y - v[5].y) / 1.4
}
