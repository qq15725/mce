import type { Element2D, Vector2Data } from 'modern-canvas'
import { definePlugin } from '../editor'
import { createTextElement } from '../utils'

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
    setState,
    t,
    exec,
    addElement,
  } = editor

  return {
    name: 'text',
    commands: {
      insertText: (content = t('clickEditText'), options = {}) => {
        const { style, ...restOptions } = options
        return addElement(createTextElement(content, style), {
          sizeToFit: true,
          positionToFit: true,
          ...restOptions,
        })
      },
      drawText: (content, options) => {
        setState('drawing', {
          content: 'text',
          callback: (position: Vector2Data) => {
            exec('insertText', content, { ...options, position })
          },
        })
      },
    },
  }
})
