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
    components: [
      { type: 'overlay', component: Frames },
    ],
    drawingTools: [
      {
        name: 'frame',
        handle: (start) => {
          const el = addElement({
            name: t('frame'),
            meta: {
              inPptIs: 'GroupShape',
              inEditorIs: 'Frame',
            },
          }, {
            position: start,
            active: true,
          })
          // TODO
          el.style.backgroundColor = '#ffffff'
          return {
            move: (move) => {
              el.style.width = Math.abs(move.x - start.x)
              el.style.height = Math.abs(move.y - start.y)
            },
            end: () => {
              setActiveDrawingTool(undefined)
            },
          }
        },
      },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:frame', key: 'f' },
    ],
  }
})
