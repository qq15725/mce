import type { Vector2Data } from 'modern-canvas'
import { measureText } from 'modern-text'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      insertText: (content?: string, style?: Record<string, any>) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    setState,
    addElement,
  } = editor

  registerCommand([
    {
      key: 'insertText',
      handle: (content = '点击编辑文本', style: Record<string, any> = {}) => {
        setState('drawing', {
          content: 'text',
          callback: (pos: Vector2Data) => {
            const box = measureText({ style, content }).boundingBox
            const width = box.width
            const height = box.height
            addElement({
              style: {
                width,
                height,
                left: pos.x,
                top: pos.y,
              },
              text: {
                content,
              },
              meta: {
                inPptIs: 'Shape',
              },
            })
          },
        })
      },
    },
  ])
})
