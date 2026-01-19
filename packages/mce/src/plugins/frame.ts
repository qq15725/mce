import Frames from '../components/Frames.vue'
import { definePlugin } from '../plugin'

export default definePlugin((editor) => {
  const {
    setActiveDrawingTool,
    addElement,
    t,
  } = editor

  return {
    name: 'mce:frame',
    drawingTools: [
      {
        name: 'frame',
        handle: (start) => {
          const el = addElement({
            name: t('frame'),
            style: {
              overflow: 'hidden',
            },
            meta: {
              inPptIs: 'GroupShape',
              inEditorIs: 'Frame',
              inCanvasIs: 'Element2D',
            },
          }, {
            position: start,
            active: true,
          })
          // TODO
          el.style.backgroundColor = '#ffffff'
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
      { command: 'setActiveDrawingTool:frame', key: 'F' },
    ],
    components: [
      { type: 'overlay', component: Frames, order: 'before' },
    ],
  }
})
