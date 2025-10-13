import type { Element2D, Vector2Data } from 'modern-canvas'
import { measureText } from 'modern-text'
import { definePlugin } from '../../editor'

declare global {
  namespace Mce {
    interface Commands {
      drawText: (content?: string, style?: Record<string, any>) => void
      insertText: (content?: string, style?: Record<string, any>, pos?: Vector2Data) => Element2D
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    setState,
    addElement,
    t,
  } = editor

  registerCommand([
    { key: 'drawText', handle: drawText },
    { key: 'insertText', handle: insertText },
  ])

  function drawText(
    content = t('clickEditText'),
    style?: Record<string, any>,
  ) {
    setState('drawing', {
      content: 'text',
      callback: (pos: Vector2Data) => {
        insertText(content, style, pos)
      },
    })
  }

  function insertText(
    content = t('clickEditText'),
    style?: Record<string, any>,
    pos?: Vector2Data,
  ) {
    const box = measureText({ style, content }).boundingBox
    const width = box.width
    const height = box.height
    return addElement({
      style: {
        width,
        height,
        left: pos?.x ?? 0,
        top: pos?.y ?? 0,
      },
      text: {
        content,
      },
      meta: {
        inPptIs: 'Shape',
      },
    }, pos
      ? undefined
      : { sizeToFit: true, positionToFit: true })
  }
})
