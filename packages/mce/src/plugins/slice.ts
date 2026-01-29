import type { Element2D } from 'modern-canvas'
import { DrawboardEffect, render } from 'modern-canvas'
import { definePlugin } from '../plugin'

export default definePlugin((editor) => {
  const {
    setActiveDrawingTool,
    addElement,
    t,
    elementSelection,
    inEditorIs,
    to,
    fonts,
    drawboardEffect,
  } = editor

  async function exportSlice(options: Mce.ExportOptions) {
    const el = elementSelection.value[0] as Element2D

    if (!el || !inEditorIs(el, 'Slice')) {
      return
    }

    const aabb = el.globalAabb

    const doc = to('json', {
      ...options,
      selected: (el.parent?.children.filter(node => !node.equal(el)) ?? []) as any[],
    })

    doc.children.unshift({
      position: {
        x: aabb.left,
        y: aabb.top,
      },
      meta: {
        inCanvasIs: 'Camera2D',
      },
    } as any)

    return await render({
      data: doc,
      fonts,
      width: aabb.width,
      height: aabb.height,
      onBefore: (engine) => {
        engine.root.append(
          new DrawboardEffect({
            ...drawboardEffect.value.getProperties(),
            internalMode: 'back',
            effectMode: 'before',
            checkerboard: false,
            pixelGrid: false,
          }),
        )
      },
    })
  }

  return {
    name: 'mce:slice',
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
              setActiveDrawingTool(undefined)
            },
          }
        },
      },
    ],
    commands: [
      { command: 'exportSlice', handle: exportSlice },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:slice', key: 'S' },
    ],
  }
})
