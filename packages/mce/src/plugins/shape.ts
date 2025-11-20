import type { Shape } from 'modern-idoc'
import { Path2D } from 'modern-path2d'
import { definePlugin } from '../plugin'
import { createShapeElement } from '../utils'

declare global {
  namespace Mce {
    interface DrawingTools {
      rectangle: []
      line: []
      arrow: []
      ellipse: []
      polygon: []
      star: []
    }
  }
}

interface Point { x: number, y: number }

type ArrowType = 'none' | 'open' | 'filled'

interface ArrowOptions {
  size?: number
  angle?: number
  startMarker?: ArrowType
  endMarker?: ArrowType
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
  options: ArrowOptions = {},
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

export default definePlugin((editor) => {
  const {
    addElement,
    setActiveDrawingTool,
  } = editor

  function createHandle(shape: Shape): Mce.DrawingToolHandle {
    return (start) => {
      const el = addElement(createShapeElement(shape, '#d9d9d9'), {
        position: start,
        active: true,
      })
      return {
        move: (move) => {
          el.style.width = move.x - start.x
          el.style.height = move.y - start.y
        },
        end: () => {
          setActiveDrawingTool(undefined)
        },
      }
    }
  }

  return {
    name: 'mce:shape',
    drawingTools: [
      {
        name: 'rectangle',
        handle: createHandle([{ data: 'M4 6v13h16V6z' }]),
      },
      {
        name: 'line',
        handle: (start) => {
          const el = addElement({
            outline: {
              color: '#d9d9d9',
              width: 5,
              lineCap: 'round',
              lineJoin: 'round',
            },
            meta: {
              inPptIs: 'Shape',
            },
          }, {
            position: start,
          })
          const path = new Path2D()
          return {
            move: (move) => {
              path.reset()
              path.moveTo(start.x, start.y)
              path.lineTo(move.x, move.y)
              el.shape.paths = [
                { data: path.toData() },
              ]
              const box = path.getBoundingBox()
              el.style.left = box.left
              el.style.top = box.top
              el.style.width = box.width
              el.style.height = box.height
            },
            end: () => {
              setActiveDrawingTool(undefined)
            },
          }
        },
      },
      {
        name: 'arrow',
        handle: (start) => {
          const el = addElement({
            outline: {
              color: '#d9d9d9',
              width: 5,
              lineCap: 'round',
              lineJoin: 'round',
            },
            meta: {
              inPptIs: 'Shape',
            },
          }, {
            position: start,
          })
          return {
            move: (move) => {
              const data = getArrowPath(start, move)
              el.shape.paths = [
                { data },
              ]
              const box = new Path2D(data).getBoundingBox()
              el.style.left = box.left
              el.style.top = box.top
              el.style.width = box.width
              el.style.height = box.height
            },
            end: () => {
              setActiveDrawingTool(undefined)
            },
          }
        },
      },
      {
        name: 'ellipse',
        handle: createHandle([{ data: 'M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2' }]),
      },
      {
        name: 'polygon',
        handle: createHandle([{ data: 'M1 21h22L12 2' }]),
      },
      {
        name: 'star',
        handle: createHandle([{ data: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2L9.19 8.62L2 9.24l5.45 4.73L5.82 21z' }]),
      },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:rectangle', key: 'r' },
      { command: 'setActiveDrawingTool:line', key: 'l' },
      { command: 'setActiveDrawingTool:arrow', key: 'Shift+l' },
      { command: 'setActiveDrawingTool:ellipse', key: 'o' },
    ],
  }
})
