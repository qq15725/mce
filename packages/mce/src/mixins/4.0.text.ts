import type { Element2D } from 'modern-canvas'
import type { NormalizedFill, NormalizedFragment, NormalizedParagraph, NormalizedTextContent } from 'modern-idoc'
import type { IndexCharacter } from 'modern-text/web-components'
import { isEqualObject, normalizeCRLF } from 'modern-idoc'
import { measureText } from 'modern-text'
import { TextEditor } from 'modern-text/web-components'
import { computed } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      textFontSizeToFit: (element: Element2D, scale?: number) => void
      textToFit: (element: Element2D, typography?: Mce.TypographyStrategy) => void
      getTextStyle: (key: string) => any
      setTextStyle: (key: string, value: any) => void
      getTextFill: () => NormalizedFill | undefined
      setTextFill: (value: NormalizedFill | undefined) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    isElement,
    config,
    elementSelection,
    textSelection,
  } = editor

  function textFontSizeToFit(element: Element2D, scale?: number): void {
    function _handle(element: Element2D): void {
      if (!scale) {
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
        scale = (element.style.width ?? 0) / (boundingBox.width + fontSize)
      }

      function _scaleStyle(style: any): void {
        if (style.fontSize)
          style.fontSize = style.fontSize * scale!
        // style.fontSize = Math.max(12, style.fontSize * scale)
        if (style.letterSpacing)
          style.letterSpacing = style.letterSpacing * scale!
        // style.letterSpacing = Math.max(1, style.letterSpacing * scale)
      }

      _scaleStyle(element.style)

      if (element.text?.isValid?.() && Array.isArray(element.text?.content)) {
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
      if (!element.text?.isValid?.() || typeof element.text?.content !== 'object') {
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

  const element = computed(() => elementSelection.value[0])

  const hasSelectionRange = computed(() => {
    return (textSelection.value?.length ?? 0) > 1
      && textSelection.value![0] !== textSelection.value![1]
  })

  function handleSelection([start, end]: IndexCharacter[], cb: (arg: Record<string, any>) => boolean) {
    let flag = true
    element.value?.text?.content.forEach((p, pIndex, pItems) => {
      if (!flag)
        return
      p.fragments.forEach((f, fIndex, fItems) => {
        if (!flag)
          return
        const { content, ...fStyle } = f
        Array.from(normalizeCRLF(content)).forEach((c, cIndex, cItems) => {
          flag = cb({
            selected:
              (pIndex > start.paragraphIndex
                || (pIndex === start.paragraphIndex && fIndex > start.fragmentIndex)
                || (pIndex === start.paragraphIndex
                  && fIndex === start.fragmentIndex
                  && cIndex >= start.charIndex))
                && (pIndex < end.paragraphIndex
                  || (pIndex === end.paragraphIndex && fIndex < end.fragmentIndex)
                  || (pIndex === end.paragraphIndex
                    && fIndex === end.fragmentIndex
                    && (end.isLastSelected ? cIndex <= end.charIndex : cIndex < end.charIndex))),
            p,
            pIndex,
            pLength: pItems.length,
            f,
            fIndex,
            fStyle,
            fLength: fItems.length,
            c,
            cLength: cItems.length,
            cIndex,
          })
        })
      })
    })
  }

  function getTextStyle(key: string): any {
    if (!element.value) {
      return undefined
    }

    let value = (element.value.style as any)[key]
    const content = element.value.text.content

    if (hasSelectionRange.value) {
      const selection = textSelection.value
      if (selection && selection[0] && selection[1]) {
        handleSelection(selection, ({ selected, fStyle }) => {
          if (selected && fStyle[key]) {
            value = fStyle[key]
            return false
          }
          return true
        })
      }
    }
    else {
      // TODO
      switch (key) {
        case 'fontSize':
          return content?.reduce((prev, p) => {
            return p.fragments.reduce((prev, f) => {
              return ~~Math.max(prev, f[key] as number ?? 0)
            }, prev)
          }, value as number) ?? value as number
        default:
          if (
            content.length === 1
            && content[0].fragments.length === 1
            && (content[0].fragments[0] as any)[key]
          ) {
            return (content[0].fragments[0] as any)[key] as any
          }
      }
    }

    return value
  }

  function setTextStyle(key: string, value: any): void {
    if (!element.value) {
      return
    }

    let isAllSelected = false
    if (hasSelectionRange.value) {
      const selection = textSelection.value
      if (selection && selection[0] && selection[1]) {
        if (selection[0].isFirst && selection[1].isLast && selection[1].isLastSelected) {
          isAllSelected = true
        }
        else {
          const newContent: NormalizedTextContent = []
          let newParagraph: NormalizedParagraph = { fragments: [] }
          let newFragment: NormalizedFragment | undefined
          handleSelection(selection, ({ selected, fIndex, fStyle, fLength, c, cIndex, cLength }) => {
            if (fIndex === 0 && cIndex === 0) {
              newParagraph = { fragments: [] }
              newFragment = undefined
            }
            const style = { ...fStyle }
            if (selected) {
              style[key] = value
            }
            if (newFragment) {
              const { content: _, ..._style } = newFragment
              if (isEqualObject(style, _style)) {
                newFragment.content += c
              }
              else {
                newParagraph.fragments.push(newFragment)
                newFragment = { ...style, content: c }
              }
            }
            else {
              newFragment = { ...style, content: c }
            }
            if (fIndex === fLength - 1 && cIndex === cLength - 1) {
              if (newFragment) {
                newParagraph.fragments.push(newFragment)
              }
              if (newParagraph.fragments.length) {
                newContent.push(newParagraph)
                newParagraph = { fragments: [] }
              }
            }
            return true
          })
          if (newContent.length) {
            element.value.text.content = newContent
          }
        }
      }
    }
    else {
      isAllSelected = true
    }
    if (isAllSelected) {
      const el = element.value
      switch (key) {
        case 'fill':
        case 'outline':
          (el.text as any)[key] = value
          break
        default:
          (el.style as any)[key] = value
          break
      }
      const content = element.value.text.content
      content.forEach((p) => {
        delete (p as any)[key]
        p.fragments.forEach((f) => {
          delete (f as any)[key]
        })
      })
      el.text.content = content
    }
    element.value.requestRedraw()
    textToFit(element.value)
  }

  function getTextFill(): NormalizedFill | undefined {
    if (!element.value) {
      return undefined
    }

    let fill
    if (hasSelectionRange.value) {
      fill = getTextStyle('fill')
      if (!fill) {
        const color = getTextStyle('color')
        fill = { color }
      }
    }
    fill = fill
      ?? element.value.text.fill
      ?? { color: element.value.style.color }
    return fill
  }

  function setTextFill(value: NormalizedFill | undefined): void {
    if (!element.value) {
      return
    }

    if (hasSelectionRange.value && value?.color) {
      setTextStyle('fill', value)
    }
    else {
      element.value.text.fill = value
      if (value?.color) {
        element.value.style.color = value.color
      }
      element.value.text.content.forEach((p) => {
        delete p.fill
        delete p.color
        p.fragments.forEach((f) => {
          delete f.fill
          delete f.color
        })
      })
    }
  }

  Object.assign(editor, {
    textFontSizeToFit,
    textToFit,
    setTextStyle,
    getTextStyle,
    getTextFill,
    setTextFill,
  })

  return () => {
    TextEditor.register()
  }
})
