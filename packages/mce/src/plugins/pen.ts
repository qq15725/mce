import type { Element2D } from 'modern-canvas'
import { Aabb2D } from 'modern-canvas'
import { LineCurve, Path2D, Vector2 } from 'modern-path2d'
import { watch } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Tools {
      pen: []
      pencil: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    addElement,
    renderEngine,
    activeTool,
    activateTool,
    getGlobalPointer,
    camera,
    selection,
    state,
  } = editor

  let el: Element2D | undefined
  let currentPath: Path2D | undefined
  let currentLine: LineCurve | undefined
  let onMove: (() => void) | undefined
  let onKey: ((e: KeyboardEvent) => void) | undefined
  let stopWatch: (() => void) | undefined

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

  // End the in-progress path: drop the trailing rubber-band segment, optionally
  // close it, commit, then tear down listeners. The pen stays alive across
  // clicks until this runs (tool switch / Esc / Enter / clicking the start).
  function finish(close = false) {
    if (!el || !currentPath) {
      return
    }
    const curves = currentPath.currentCurve.curves
    if (currentLine && curves[curves.length - 1] === currentLine) {
      curves.pop()
    }
    if (close && curves.length) {
      currentPath.currentCurve.closePath()
    }
    const placed = curves.length
    const ref = el
    if (placed > 0) {
      update()
    }
    renderEngine.value.off('pointermove', onMove as any)
    if (onKey) {
      window.removeEventListener('keydown', onKey)
    }
    stopWatch?.()
    stopWatch = undefined
    onMove = undefined
    onKey = undefined
    el = undefined
    currentPath = undefined
    currentLine = undefined
    if (placed > 0) {
      selection.value = [ref]
    }
    else {
      ref.remove()
    }
  }

  return {
    name: 'mce:pen',
    tools: [
      {
        name: 'pen',
        handle: (start) => {
          if (el && currentPath) {
            // Click near the first anchor to close the path.
            const first = currentPath.currentCurve.curves[0] as LineCurve | undefined
            const threshold = 8 / (camera.value.zoom.x || 1)
            if (first && currentPath.currentCurve.curves.length > 1 && first.p1.distanceTo(start) < threshold) {
              finish(true)
              activateTool(undefined)
              return
            }
            // Commit the current rubber band, start a new one from this click.
            currentLine = new LineCurve(
              new Vector2(start.x, start.y),
              new Vector2(start.x, start.y),
            )
            currentPath.currentCurve.addCurve(currentLine)
            update()
            return
          }
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

          onMove = () => {
            const move = getGlobalPointer()
            if (currentLine && move) {
              currentLine.p2.x = move.x
              currentLine.p2.y = move.y
              update()
            }
          }
          renderEngine.value.on('pointermove', onMove)

          onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault()
              finish(false)
              activateTool(undefined)
            }
          }
          window.addEventListener('keydown', onKey)

          // Finish (without changing tool) when the tool/state changes externally.
          stopWatch = watch([state, activeTool], () => finish(false))
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

          const parentAabb = el.getParent<Element2D>()?.globalAabb ?? new Aabb2D()

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
      { command: 'activateTool:pen', key: 'P' },
      { command: 'activateTool:pencil', key: 'Shift+P' },
    ],
  }
})
