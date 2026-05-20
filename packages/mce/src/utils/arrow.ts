interface Point { x: number, y: number }

export type ArrowMarker = 'none' | 'open' | 'filled'

export interface ArrowPathOptions {
  size?: number
  angle?: number
  startMarker?: ArrowMarker
  endMarker?: ArrowMarker
  roundValues?: boolean
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
    size = 10,
    angle = 30,
    startMarker = 'none',
    endMarker = 'open',
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
