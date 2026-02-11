import type { Node } from 'modern-canvas'
import type { Doc } from '../nodes'
import { onBeforeMount, onScopeDispose } from 'vue'
import Frames from '../components/Frames.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface FrameConfig {
      gap: number
      outline: boolean
      thumbnail: boolean
    }

    interface CanvasConfig {
      frame: FrameConfig
    }
  }
}

export default definePlugin((editor) => {
  const {
    setActiveDrawingTool,
    addElement,
    t,
    registerConfig,
  } = editor

  const config = registerConfig('canvas.frame', {
    default: {
      gap: 48,
      outline: false,
      thumbnail: false,
    },
  })

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
          el.style.width = 1
          el.style.height = 1
          el.style.backgroundColor = '#ffffff'
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
      {
        type: 'overlay',
        component: Frames,
        order: 'before',
      },
    ],
    setup: () => {
      const {
        on,
        off,
        inEditorIs,
        snapshot,
        captureFrameScreenshot,
        frames,
        frameThumbs,
      } = editor

      function onSetDoc(doc: Doc) {
        if (config.value.thumbnail) {
          snapshot()
        }

        function onAddChild(node: Node, _newIndex: number): void {
          if (config.value.thumbnail && inEditorIs(node, 'Frame')) {
            const index = frames.value.findIndex(f => f.equal(node))
            frameThumbs.value.splice(index, 0, {
              instanceId: -1,
              width: 0,
              height: 0,
              url: '',
            })
            captureFrameScreenshot(index)
          }
        }

        function onRemoveChild(node: Node, _oldIndex: number): void {
          if (config.value.thumbnail && inEditorIs(node, 'Frame')) {
            frameThumbs.value.splice(
              frameThumbs.value.findIndex(v => v.instanceId === node.instanceId),
              1,
            )
          }
        }

        doc.on('addChild', onAddChild)
        doc.on('removeChild', onRemoveChild)
      }

      onBeforeMount(() => {
        on('setDoc', onSetDoc)
      })

      onScopeDispose(() => {
        off('setDoc', onSetDoc)
      })
    },
  }
})
