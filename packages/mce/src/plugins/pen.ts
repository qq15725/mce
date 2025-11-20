import { Path2D } from 'modern-path2d'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface DrawingTools {
      pencil: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    addElement,
  } = editor

  return {
    name: 'mce:pen',
    drawingTools: [
      {
        name: 'pencil',
        handle: (start) => {
          const el = addElement({
            name: 'pencil',
            outline: {
              color: '#d9d9d9',
              width: 10,
            },
            meta: {
              inPptIs: 'Shape',
            },
          }, {
            position: start,
          })
          const path = new Path2D()
          path.moveTo(start.x, start.y)
          return {
            move: (move) => {
              path.lineTo(move.x, move.y)
              path.moveTo(move.x, move.y)
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
              //
            },
          }
        },
      },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:pencil', key: 'Shift+p' },
    ],
  }
})
