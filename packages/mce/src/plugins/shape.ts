import type { Shape } from 'modern-idoc'
import { Path2D } from 'modern-path2d'
import { definePlugin } from '../plugin'
import { createChartElement, createShapeElement, createTableElement, getArrowPath } from '../utils'

declare global {
  namespace Mce {
    interface Tools {
      rectangle: []
      line: []
      arrow: []
      ellipse: []
      polygon: []
      star: []
      table: []
      chartBar: []
      chartLine: []
      chartPie: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    addElement,
    activateTool,
  } = editor

  function createHandle(shape: Shape): Mce.ToolHandle {
    return (start) => {
      const el = addElement(createShapeElement(shape, '#d9d9d9'), {
        position: start,
        active: true,
      })
      el.style.width = 1
      el.style.height = 1
      return {
        move: (move) => {
          const minX = Math.min(move.x, start.x)
          const minY = Math.min(move.y, start.y)
          const maxX = Math.max(move.x, start.x)
          const maxY = Math.max(move.y, start.y)
          el.style.left = minX
          el.style.top = minY
          el.style.width = Math.max(1, maxX - minX)
          el.style.height = Math.max(1, maxY - minY)
        },
        end: () => {
          activateTool(undefined)
        },
      }
    }
  }

  return {
    name: 'mce:shape',
    tools: [
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
              activateTool(undefined)
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
              activateTool(undefined)
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
      // table/chart 为点击插入默认示例（固定尺寸），不走拖拽缩放
      {
        name: 'table',
        handle: (start) => {
          addElement(createTableElement(), { position: start, active: true })
          return { end: () => activateTool(undefined) }
        },
      },
      {
        name: 'chartBar',
        handle: (start) => {
          addElement(createChartElement('column'), { position: start, active: true })
          return { end: () => activateTool(undefined) }
        },
      },
      {
        name: 'chartLine',
        handle: (start) => {
          addElement(createChartElement('line'), { position: start, active: true })
          return { end: () => activateTool(undefined) }
        },
      },
      {
        name: 'chartPie',
        handle: (start) => {
          addElement(createChartElement('pie'), { position: start, active: true })
          return { end: () => activateTool(undefined) }
        },
      },
    ],
    hotkeys: [
      { command: 'activateTool:rectangle', key: 'R' },
      { command: 'activateTool:line', key: 'L' },
      { command: 'activateTool:arrow', key: 'Shift+L' },
      { command: 'activateTool:ellipse', key: 'O' },
    ],
  }
})
