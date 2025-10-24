import type { Element2D } from 'modern-canvas'
import type { NormalizedElement } from 'modern-idoc'
import { defineMixin } from '../../editor'

declare global {
  namespace Mce {
    interface JsonData {
      style: {
        width: number
        height: number
        scaleX: number
        scaleY: number
      }
      children: NormalizedElement[]
      meta: {
        inPptIs: 'Pptx'
        inCanvasIs: 'Node2D'
        startTime: number
        endTime: number
      }
    }

    interface Exporters {
      json: JsonData
    }
  }
}

export default defineMixin((editor) => {
  const {
    registerExporter,
    getAabb,
    selection,
    root,
    getTimeRange,
  } = editor

  registerExporter({
    name: 'json',
    handle: (options) => {
      const {
        selected = false,
        scale,
      } = options

      let elements: Element2D[] = []
      if (Array.isArray(selected)) {
        elements = selected
      }
      else {
        if (selected === true) {
          elements = selection.value
        }

        if (elements.length === 0) {
          elements = (root.value?.children ?? []) as Element2D[]
        }
      }

      const box = getAabb(elements, 'frame')

      return {
        style: {
          width: box.width,
          height: box.height,
          scaleX: scale,
          scaleY: scale,
        },
        children: elements.map((el) => {
          const json = el.toJSON()
          if (box.left) {
            json.style.left = (json.style.left ?? 0) - box.left
          }
          if (box.top) {
            json.style.top = (json.style.top ?? 0) - box.top
          }
          json.meta ??= {}
          json.meta.inPptIs = 'Slide'
          return json
        }),
        meta: {
          inPptIs: 'Pptx',
          inCanvasIs: 'Node2D',
          ...getTimeRange(elements),
        },
      } as any
    },
  })
})
