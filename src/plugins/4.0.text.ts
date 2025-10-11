import { Element2D } from 'modern-canvas'
import { measureText } from 'modern-text'
import { definePlugin } from '../editor'
import { TextEditor } from './web-components/TextEditor'

declare global {
  namespace Mce {
    interface Editor {
      textFontSizeToFit: (element: Element2D) => void
      textToFit: (element: Element2D, typography?: Mce.TypographyStrategy) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
  } = editor

  function textFontSizeToFit(element: Element2D): void {
    function _handle(element: Element2D): void {
      const chars = element.text.base.characters
      let pos = 0
      let char: any | undefined
      chars.forEach((_char) => {
        const _pos = _char.lineBox.left + _char.lineBox.width
        if (_pos > pos) {
          char = _char
          pos = _pos
        }
      })
      const style = {}
      const content = chars
        .filter(_char => _char.lineBox.top === char?.lineBox.top)
        .map((char) => {
          Object.assign(
            style,
            { ...char.parent.style },
            { ...char.parent.parent.style },
          )
          return char.content
        })
        .join('')

      const { boundingBox } = measureText({
        style: {
          ...element.style.toJSON(),
          width: 'auto',
        },
        content: [
          {
            fragments: [
              { ...style, content },
            ],
          },
        ],
      })

      const fontSize = (element.style.fontSize || 12) / 2
      const scale = (element.style.width ?? 0) / (boundingBox.width + fontSize)

      function _scaleStyle(style: any): void {
        if (style.fontSize)
          style.fontSize = style.fontSize * scale
          // style.fontSize = Math.max(12, style.fontSize * scale)
        if (style.letterSpacing)
          style.letterSpacing = style.letterSpacing * scale
          // style.letterSpacing = Math.max(1, style.letterSpacing * scale)
      }

      _scaleStyle(element.style)

      if (element.text?.canDraw?.() && Array.isArray(element.text?.content)) {
        element.text.content.forEach((p) => {
          _scaleStyle(p)
          p.fragments.forEach((f) => {
            _scaleStyle(f)
          })
        })
      }

      element.requestRedraw()
    }

    _handle(element)
    element.forEachDescendant((descendant) => {
      if (descendant instanceof Element2D) {
        _handle(descendant)
      }
    })
  }

  function textToFit(element: Element2D, typography?: Mce.TypographyStrategy): void {
    const strategy = typography ?? config.value.typographyStrategy
    if (strategy === 'fixedWidthHeight') {
      return
    }
    else if (strategy === 'autoFontSize') {
      textFontSizeToFit(element)
      return
    }

    function _handle(element: Element2D): void {
      if (!element.text?.canDraw?.() || typeof element.text?.content !== 'object') {
        return
      }

      const style = element.style.toJSON()

      switch (strategy) {
        case 'autoWidth':
          style.width = 'auto'
          break
        case 'autoHeight':
          style.height = 'auto'
          break
      }

      const { boundingBox } = measureText({
        style,
        content: element.text.content,
      })

      if (
        element.style.width !== boundingBox.width
        || element.style.height !== boundingBox.height
      ) {
        element.style.width = boundingBox.width
        element.style.height = boundingBox.height
        element.requestRedraw()
      }
    }

    _handle(element)
    element.forEachDescendant((descendant) => {
      if (descendant instanceof Element2D) {
        _handle(descendant)
      }
    })
  }

  Object.assign(editor, {
    textFontSizeToFit,
    textToFit,
  })

  return () => {
    TextEditor.register()
  }
})
