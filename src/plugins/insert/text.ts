import type { Element2D, Vector2Data } from 'modern-canvas'
import { measureText } from 'modern-text'
import { definePlugin } from '../../editor'

declare global {
  namespace Mce {
    interface InsertTextOptions extends AddElementOptions {
      style?: Record<string, any>
    }

    interface Commands {
      insertText: (content?: string, options?: InsertTextOptions) => Element2D
      drawText: (content?: string, options?: InsertTextOptions) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    setState,
    t,
    exec,
    addElement,
  } = editor

  registerCommand('insertText', (content = t('clickEditText'), options = {}) => {
    const { style, ...restOptions } = options
    const box = measureText({ style, content }).boundingBox
    return addElement({
      style: {
        ...style,
        width: box.width,
        height: box.height,
      },
      text: { content },
      meta: { inPptIs: 'Shape' },
    }, {
      sizeToFit: true,
      positionToFit: true,
      ...restOptions,
    })
  })

  registerCommand('drawText', (content, options) => {
    setState('drawing', {
      content: 'text',
      callback: (position: Vector2Data) => {
        exec('insertText', content, { ...options, position })
      },
    })
  })
})
