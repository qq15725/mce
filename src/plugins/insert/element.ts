import type { Element2D, Vector2Data } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { definePlugin } from '../../editor'

declare global {
  namespace Mce {
    export interface InsertElementOptions {
      position?: Vector2Data
      inPointerPosition?: boolean
      active?: boolean
    }

    interface Commands {
      insertElement: (element: Element, options?: InsertElementOptions) => Element2D
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    addElement,
    getGlobalPointer,
    setActiveElement,
  } = editor

  registerCommand('insertElement', (element, options = {}) => {
    let { position, inPointerPosition, active } = options

    if (!position) {
      if (inPointerPosition) {
        position = getGlobalPointer()
      }
    }

    if (position) {
      if (!element.style || typeof element.style === 'string') {
        element.style = {}
      }
      ;(element.style as any).left = position.x
      ;(element.style as any).top = position.y
    }

    const res = addElement(
      element,
      position
        ? undefined
        : { sizeToFit: true, positionToFit: true },
    )

    if (active && res) {
      setActiveElement(res)
    }

    return res
  })
})
