import type { Element2D } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { createTextElement } from '../utils'

declare global {
  namespace Mce {
    interface addTextElementOptions extends AddElementOptions {
      content?: string
      style?: Record<string, any>
    }

    interface Commands {
      addTextElement: (options?: addTextElementOptions) => Element2D
    }

    interface DrawingTools {
      text: [options?: addTextElementOptions]
    }
  }
}

export default definePlugin((editor) => {
  const {
    t,
    addElement,
    setActiveDrawingTool,
  } = editor

  const addTextElement: Mce.Commands['addTextElement'] = (options = {}) => {
    const {
      content = t('doubleClickEditText'),
      style,
      ...restOptions
    } = options

    return addElement(
      createTextElement(content, {
        fontSize: 64,
        ...style,
      }),
      {
        sizeToFit: true,
        active: true,
        ...restOptions,
      },
    )
  }

  const RE = /\.txt$/i

  return {
    name: 'mce:text',
    commands: [
      { command: 'addTextElement', handle: addTextElement },
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
    drawingTools: [
      {
        name: 'text',
        handle: (position) => {
          addTextElement({
            position,
          })
          setActiveDrawingTool(undefined)
        },
      },
    ],
    hotkeys: [
      { command: 'setActiveDrawingTool:text', key: 't' },
    ],
  }
})
