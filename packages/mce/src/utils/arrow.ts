interface Point { x: number, y: number }

export type ArrowMarker = 'none' | 'open' | 'filled'

export interface ArrowPathOptions {
  size?: number
  angle?: number
  startMarker?: ArrowMarker
  endMarker?: ArrowMarker
  roundValues?: boolean
}

// 锥形实心箭头：尾部细、向头部渐宽，末端是实心三角头。返回一个闭合多边形 path
// （用元素 fill 填充）。顶点顺序固定为 [尾左, 颈左, 翼左, 尖, 翼右, 颈右, 尾右]，
// 便于反向取端点（尖 = 顶点3，尾中点 = (顶点0+顶点6)/2，宽度 = 颈宽/1.4）。
export const TAPERED_ARROW_VERTEX_COUNT = 7

export function getTaperedArrowPath(p1: Point, p2: Point, width: number): string {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = -uy // 垂直方向单位向量
  const ny = ux

  const tailHalf = width * 0.12
  const neckHalf = width * 0.7
  const headHalf = width * 2.4
  // 箭头头部长度，随线宽放大，但不超过整条长度的一半。
  const headLen = Math.min(width * 5, len * 0.5)
  const neckDist = len - headLen

  // 沿轴 a、垂直偏移 h 处的点。
  const at = (a: number, h: number): Point => ({
    x: p1.x + ux * a + nx * h,
    y: p1.y + uy * a + ny * h,
  })
  const v = [
    at(0, -tailHalf), // 0 尾左
    at(neckDist, -neckHalf), // 1 颈左
    at(neckDist, -headHalf), // 2 翼左
    at(len, 0), // 3 尖
    at(neckDist, headHalf), // 4 翼右
    at(neckDist, neckHalf), // 5 颈右
    at(0, tailHalf), // 6 尾右
  ]
  const f = (n: number): number => Math.round(n * 100) / 100
  const segs = [
    `M ${f(v[0].x)} ${f(v[0].y)}`,
    ...v.slice(1).map(p => `L ${f(p.x)} ${f(p.y)}`),
    'Z',
  ]
  return segs.join(' ')
}

function rotatePoint(center: Point, point: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const dx = point.x - center.x
  const dy = point.y - center.y

  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  }
}

export function getArrowPath(
  p1: Point,
  p2: Point,
  options: ArrowPathOptions = {},
): string {
  const {
    size = 16,
    angle = 26,
    startMarker = 'none',
    endMarker = 'filled',
    roundValues = true,
  } = options

  const fmt = (n: number) => (roundValues ? Math.round(n) : n.toFixed(2))

  let d = `M ${fmt(p1.x)} ${fmt(p1.y)} L ${fmt(p2.x)} ${fmt(p2.y)}`

  const theta = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  const angleRad = (angle * Math.PI) / 180

  if (endMarker !== 'none') {
    const baseWing = { x: p2.x - size, y: p2.y }

    const wing1 = rotatePoint(p2, baseWing, theta + angleRad)
    const wing2 = rotatePoint(p2, baseWing, theta - angleRad)

    if (endMarker === 'open') {
      d += ` M ${fmt(wing1.x)} ${fmt(wing1.y)} L ${fmt(p2.x)} ${fmt(p2.y)} L ${fmt(wing2.x)} ${fmt(wing2.y)}`
    }
    else if (endMarker === 'filled') {
      d += ` M ${fmt(wing1.x)} ${fmt(wing1.y)} L ${fmt(p2.x)} ${fmt(p2.y)} L ${fmt(wing2.x)} ${fmt(wing2.y)} Z`
    }
  }

  if (startMarker !== 'none') {
    const baseWingStart = { x: p1.x + size, y: p1.y }

    const wing1 = rotatePoint(p1, baseWingStart, theta + angleRad)
    const wing2 = rotatePoint(p1, baseWingStart, theta - angleRad)

    if (startMarker === 'open') {
      d += ` M ${fmt(wing1.x)} ${fmt(wing1.y)} L ${fmt(p1.x)} ${fmt(p1.y)} L ${fmt(wing2.x)} ${fmt(wing2.y)}`
    }
    else if (startMarker === 'filled') {
      d += ` M ${fmt(wing1.x)} ${fmt(wing1.y)} L ${fmt(p1.x)} ${fmt(p1.y)} L ${fmt(wing2.x)} ${fmt(wing2.y)} Z`
    }
  }

  return d
}
