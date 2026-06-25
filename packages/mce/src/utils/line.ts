import type { Element2D } from 'modern-canvas'
import { Path2D, svgPathDataToCommands } from 'modern-path2d'

export interface LineShapeInfo {
  // 'line'  —— 单段直线（M L）
  // 'arrow' —— 直线 + 箭头翼（getArrowPath 的结构：主干 M L + 翼 M L L[ Z]）
  kind: 'line' | 'arrow'
}

export interface LinePoint {
  x: number
  y: number
}

// 纯几何判定一个元素是否为「直线 / 箭头」这类开放线条，供端点式选择框使用。
// 只看 shape 的 path 结构，不依赖创建时的 meta 标记，因此对历史数据、外部导入
// (SVG/PSD)、协同同步过来的元素同样成立。
export function parseLineShape(el: Element2D): LineShapeInfo | null {
  const shape = (el as any).shape
  const paths = shape?.paths
  // 线/箭头都是单个 path（箭头的翼是同一 path data 里的第二个子路径）
  if (!paths || paths.length !== 1) {
    return null
  }
  // 有有效填充说明是面状形状（如三角形/多边形），不是线
  if ((el as any).fill?.isValid?.()) {
    return null
  }
  const raw: string = paths[0]?.data ?? ''
  if (!raw) {
    return null
  }
  // 归一化为绝对 M/L：把 H/V、相对命令(h/v/l/m)统一成 L，否则用 H/V 表达的
  // 水平/垂直线、或导入数据里的相对命令会判不出来。
  const cmds = svgPathDataToCommands(new Path2D(raw).toData()) as any[]
  if (!cmds.length || cmds[0].type !== 'M') {
    return null
  }
  // 直线与默认箭头都由直线段构成；出现曲线/圆弧就不是
  if (cmds.some(c => c.type === 'C' || c.type === 'Q' || c.type === 'A')) {
    return null
  }

  // 按 M 切分子路径
  const subs: any[][] = []
  let cur: any[] = []
  for (const c of cmds) {
    if (c.type === 'M') {
      if (cur.length) {
        subs.push(cur)
      }
      cur = [c]
    }
    else {
      cur.push(c)
    }
  }
  if (cur.length) {
    subs.push(cur)
  }

  // 直线：单子路径，M + 单个 L
  if (subs.length === 1) {
    const s = subs[0]
    return s.length === 2 && s[1].type === 'L' ? { kind: 'line' } : null
  }

  // 箭头：主干 [M,L] + 翼 [M,L,L(,Z)]，翼的中间锚点与主干终点重合（getArrowPath 结构）
  if (subs.length === 2) {
    const [main, wing] = subs
    if (
      main.length === 2 && main[1].type === 'L'
      && wing.length >= 3 && wing[1].type === 'L' && wing[2].type === 'L'
    ) {
      const p2 = main[1]
      const mid = wing[1]
      if (Math.hypot(mid.x - p2.x, mid.y - p2.y) < 0.5) {
        return { kind: 'arrow' }
      }
    }
    return null
  }

  return null
}

// 取线/箭头的两个逻辑端点（全局坐标）。供端点编辑器与框选/多选时的沿线高亮共用，
// 避免各处重复 path→element→global 的映射。非线类元素返回 null。
export function getLineEndpoints(el: Element2D): [LinePoint, LinePoint] | null {
  if (!parseLineShape(el)) {
    return null
  }
  const paths = (el as any).shape?.paths ?? []
  const cmds = svgPathDataToCommands(new Path2D(paths[0]?.data ?? '').toData()) as any[]
  const pts = cmds.filter(c => 'x' in c && 'y' in c)
  const a = pts[0]
  const b = pts[1]
  if (!a || !b) {
    return null
  }
  // data 空间 bbox：modern-canvas 先把整个 shape 归一化到该 bbox，再缩放到元素尺寸
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
  const toGlobal = (x: number, y: number): LinePoint => {
    const g = (el as any).globalTransform.apply({ x: (x - dx) / dbw * sx, y: (y - dy) / dbh * sy })
    return { x: g.x, y: g.y }
  }
  return [toGlobal(a.x, a.y), toGlobal(b.x, b.y)]
}
