import type { Element2D } from 'modern-canvas'
import type { FlatDocument, NormalizedDocument } from 'modern-idoc'
import { flatDocumentToDocument, normalizeDocument } from 'modern-idoc'
import { definePlugin } from '../../editor'

declare global {
  namespace Mce {
    interface Exporters {
      json: NormalizedDocument
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerExporter,
    getAabb,
    doc,
    rootAabb,
    currentElements,
  } = editor

  registerExporter('json', (options) => {
    const {
      selected = false,
      scale,
    } = options

    let _doc: NormalizedDocument

    let elements: Element2D[] = []
    if (selected === true) {
      elements = currentElements.value
    }
    else if (Array.isArray(selected)) {
      elements = selected
    }

    if (elements.length) {
      const box = getAabb(elements, 'frame')
      _doc = {
        style: {
          width: box.width,
          height: box.height,
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
        },
      } as any
    }
    else {
      const props = doc.value?.toJSON() ?? {}
      _doc = normalizeDocument(
        flatDocumentToDocument({
          ...props,
          style: {
            ...props.style,
            ...rootAabb.value,
          },
        } as FlatDocument),
      )
    }

    _doc.style!.scaleX = scale
    _doc.style!.scaleY = scale

    return _doc
  })
})
