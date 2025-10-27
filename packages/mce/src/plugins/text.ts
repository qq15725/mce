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

  const insertText: Mce.Commands['insertText'] = (content = t('clickEditText'), options = {}) => {
    const { style, ...restOptions } = options
    return addElement(createTextElement(content, style), {
      sizeToFit: true,
      positionToFit: true,
      ...restOptions,
    })
  }

  const drawText: Mce.Commands['drawText'] = (content, options) => {
    setState('drawing', {
      content: 'text',
      callback: (position: Vector2Data) => {
        exec('insertText', content, { ...options, position })
      },
    })
  }

  const RE = /\.txt$/i

  return {
    name: 'mce:text',
    commands: [
      { command: 'insertText', handle: insertText },
      { command: 'drawText', handle: drawText },
    ],
    loaders: [
      {
        name: 'txt',
        accept: '.txt',
        test: (source) => {
          if (source instanceof Blob) {
            if (source.type.startsWith('text/plain')) {
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
          return createTextElement(await source.text())
        },
      },
    ],
  }
})
