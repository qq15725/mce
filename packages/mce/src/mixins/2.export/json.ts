import type { Element2D } from 'modern-canvas'
import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { defineMixin } from '../../editor'

declare global {
  namespace Mce {
    interface JsonData {
      id: string
      style: {
        width: number
        height: number
        transformOrigin: string
        transform: string
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
    copyAs: (exported: Mce.JsonData) => JSON.stringify(exported),
    saveAs: (exported: Mce.JsonData) => new Blob([JSON.stringify(exported)], { type: 'application/json' }),
    handle: (options) => {
      const {
        selected = false,
        scale = 1,
      } = options

      let id = idGenerator()
      let elements: Element2D[] = []
      if (Array.isArray(selected)) {
        elements = selected
      }
      else {
        if (selected === true) {
          elements = selection.value
        }

        if (elements.length === 0 && root.value) {
          if (root.value.meta.id) {
            id = root.value.meta.id
          }
          elements = root.value.children as Element2D[]
        }
      }

      const box = getAabb(elements, 'frame')

      return {
        id,
        style: {
          width: box.width * scale,
          height: box.height * scale,
          transformOrigin: 'left top',
          transform: `scale(${scale})`,
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
          inCanvasIs: 'Element2D',
          ...getTimeRange(elements),
        },
      } as any
    },
  })
})
