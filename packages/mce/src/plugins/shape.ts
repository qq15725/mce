import type { Shape } from 'modern-idoc'
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
        handle: createHandle([{ data: 'M15 3v4.59L7.59 15H3v6h6v-4.58L16.42 9H21V3m-4 2h2v2h-2M5 17h2v2H5' }]),
      },
      {
        name: 'arrow',
        handle: createHandle([{ data: 'M5 17.59L15.59 7H9V5h10v10h-2V8.41L6.41 19z' }]),
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
