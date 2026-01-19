import Frames from '../components/Frames.vue'
import { definePlugin } from '../plugin'

export default definePlugin((editor) => {
  const {
    setActiveDrawingTool,
    addElement,
    t,
  } = editor

  return {
    name: 'mce:slice',
    components: [
      { type: 'overlay', component: Frames },
    ],
    drawingTools: [
      {
        name: 'slice',
        handle: (start) => {
          const el = addElement({
            name: t('slice'),
            outline: {
              color: '#d9d9d9',
              width: 1,
              style: 'dashed',
            },
            meta: {
              inPptIs: 'Shape',
              inEditorIs: 'Slice',
              inCanvasIs: 'Element2D',
            },
          }, {
            position: start,
            active: true,
          })
          return {
            move: (move) => {
              const minX = Math.min(move.x, start.x)
              const minY = Math.min(move.y, start.y)
              const maxX = Math.max(move.x, start.x)
              const maxY = Math.max(move.y, start.y)
              el.style.left = minX
              el.style.top = minY
              el.style.width = maxX - minX
              el.style.height = maxY - minY
            },
            end: () => {
              setActiveDrawingTool(undefined)
            },
          }
        },
      },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:slice', key: 'S' },
    ],
  }
})
