import type { Element2D } from 'modern-canvas'
import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../plugin'

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
        inEditorIs: 'Doc'
        inCanvasIs: 'Element2D'
        startTime: number
        endTime: number
      }
    }

    interface Exporters {
      json: JsonData
    }
  }
}

export default definePlugin((editor) => {
  const {
    getAabb,
    elementSelection,
    root,
    getTimeRange,
  } = editor

  const RE = /\.json$/i

  return {
    name: 'mce:json',
    loaders: [
      {
        name: 'json',
        accept: '.json',
        test: (source) => {
          if (source instanceof Blob) {
            if (source.type.startsWith('application/json')) {
              return true
            }
          }
          if (source instanceof File) {
            if (RE.test(source.name)) {
              return true
            }
          }
          return false
        },
        load: async (source: File | Blob) => {
          const json = JSON.parse(await source.text())

          if (
            'version' in json
            && 'elements' in json
          ) {
            // TODO gd
            console.log(json)
          }

          return json
        },
      },
    ],
    exporters: [
      {
        name: 'json',
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
              elements = elementSelection.value
            }

            if (elements.length === 0 && root.value) {
              id = root.value.id
              elements = root.value.children as Element2D[]
            }
          }

          const box = getAabb(elements, 'parent')

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
              inEditorIs: 'Doc',
              inCanvasIs: 'Element2D',
              ...getTimeRange(elements),
            },
          } as any
        },
      },
    ],
  }
})
