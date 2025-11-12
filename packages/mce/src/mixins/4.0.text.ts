import type { Element2D } from 'modern-canvas'
import { measureText } from 'modern-text'
import { TextEditor } from 'modern-text/web-components'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      textFontSizeToFit: (element: Element2D) => void
      textToFit: (element: Element2D, typography?: Mce.TypographyStrategy) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    config,
    isElement,
  } = editor

  function textFontSizeToFit(element: Element2D): void {
    function _handle(element: Element2D): void {
      if (!element.text.isValid()) {
        return
      }

      const { boundingBox } = measureText({
        style: {
          ...element.style.toJSON(),
          width: 'auto',
        },
        content: element.text.content,
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
      element.text.content.forEach((p) => {
        _scaleStyle(p)
        p.fragments.forEach((f) => {
          _scaleStyle(f)
        })
      })

      element.requestRedraw()
    }

    _handle(element)
    element.findOne((descendant) => {
      if (isElement(descendant)) {
        _handle(descendant)
      }
      return false
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
      if (!element.text.isValid()) {
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
    element.findOne((descendant) => {
      if (isElement(descendant)) {
        _handle(descendant)
      }
      return false
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
