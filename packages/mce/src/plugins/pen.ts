import type { Element2D } from 'modern-canvas'
import { Aabb2D } from 'modern-canvas'
import { LineCurve, Path2D, Vector2 } from 'modern-path2d'
import { watch } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface DrawingTools {
      pen: []
      pencil: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    addElement,
    renderEngine,
    activeDrawingTool,
    getGlobalPointer,
    state,
  } = editor

  let el: Element2D | undefined
  let currentPath: Path2D | undefined
  let currentLine: LineCurve | undefined

  const update = () => {
    if (el && currentPath) {
      el.shape.paths = [
        { data: currentPath.toData() },
      ]
      const box = currentPath!.getBoundingBox()
      el.style.left = box.left
      el.style.top = box.top
      el.style.width = box.width || 1
      el.style.height = box.height || 1
    }
  }

  return {
    name: 'mce:pen',
    drawingTools: [
      {
        name: 'pen',
        handle: (start) => {
          if (el) {
            if (currentPath) {
              currentLine = new LineCurve(
                new Vector2(start.x, start.y),
                new Vector2(start.x, start.y),
              )
              currentPath.currentCurve.addCurve(currentLine)
              update()
            }
          }
          else {
            el = addElement({
              name: 'pen',
              style: {
                width: 1,
                height: 1,
              },
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
            currentPath = new Path2D()
            currentLine = new LineCurve(
              new Vector2(start.x, start.y),
              new Vector2(start.x, start.y),
            )
            currentPath.currentCurve.addCurve(currentLine)
            update()

            const onMove = () => {
              const move = getGlobalPointer()
              if (currentLine && move) {
                currentLine.p2.x = move.x
                currentLine.p2.y = move.y
                update()
              }
            }

            renderEngine.value.on('pointermove', onMove)
            const stop = watch([state, activeDrawingTool], () => {
              renderEngine.value.off('pointermove', onMove)
              stop()
              el = undefined
              currentPath = undefined
              currentLine = undefined
            })
          }
        },
      },
      {
        name: 'pencil',
        handle: (start) => {
          const el = addElement({
            name: 'pencil',
            style: {
              width: 1,
              height: 1,
            },
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

          const parentAabb = el.getParent<Element2D>()?.getGlobalAabb?.() ?? new Aabb2D()

          const path = new Path2D()
          path.moveTo(start.x - parentAabb.x, start.y - parentAabb.y)

          const update = () => {
            el.shape.paths = [
              { data: path.toData() },
            ]
            const box = path.getBoundingBox()
            el.style.left = box.left
            el.style.top = box.top
            el.style.width = box.width || 1
            el.style.height = box.height || 1
          }

          update()

          return {
            move: (move) => {
              path.lineTo(move.x - parentAabb.x, move.y - parentAabb.y)
              path.moveTo(move.x - parentAabb.x, move.y - parentAabb.y)
              update()
            },
          }
        },
      },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:pen', key: 'p' },
      { command: 'setActiveDrawingTool:pencil', key: 'Shift+p' },
    ],
  }
})
