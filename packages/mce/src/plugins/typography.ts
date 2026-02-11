import type { Element2D } from 'modern-canvas'
import type { FontSource } from 'modern-font'
import type { NormalizedFill, NormalizedFragment, NormalizedParagraph, NormalizedTextContent } from 'modern-idoc'
import type { Ref } from 'vue'
import type { IndexCharacter } from '../web-components'
import { isEqualObject, normalizeCRLF } from 'modern-idoc'
import { measureText } from 'modern-text'
import { computed, onBeforeMount } from 'vue'
import VueTextEditor from '../components/TextEditor.vue'
import { definePlugin } from '../plugin'
import { createTextElement } from '../utils'
import { TextEditor } from '../web-components'

declare global {
  namespace Mce {
    type TypographyStrategy
      = | 'autoHeight'
        | 'autoWidth'
        | 'fixedWidthHeight'
        | 'autoFontSize'

    interface TypographyConfig {
      strategy: TypographyStrategy
      defaultFont?: FontSource
    }

    interface Editor {
      hasTextSelectionRange: Ref<boolean>
      isTextAllSelected: Ref<boolean>
    }

    interface Config {
      typography: TypographyConfig
    }

    interface addTextElementOptions extends AddElementOptions {
      content?: string
      style?: Record<string, any>
    }

    interface Commands {
      startTyping: (event?: MouseEvent) => Promise<boolean>
      addTextElement: (options?: addTextElementOptions) => Element2D
      handleTextSelection: (textSelection: IndexCharacter[], cb: (arg: Record<string, any>) => boolean) => void
      textFontSizeToFit: (element: Element2D, scale?: number) => void
      textToFit: (element: Element2D, typography?: TypographyStrategy) => void
      getTextStyle: (key: string) => any
      setTextStyle: (key: string, value: any) => void
      getTextFill: () => NormalizedFill | undefined
      setTextFill: (value: NormalizedFill | undefined) => void
      setTextContentByEachFragment: (handler: (fragment: NormalizedFragment) => void) => void
    }

    interface Tools {
      text: [options?: addTextElementOptions]
    }
  }
}

export default definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    textSelection,
    fonts,
    getConfig,
    registerConfig,
    t,
    addElement,
    activateTool,
  } = editor

  const config = registerConfig<Mce.TypographyConfig>('typography', {
    default: {
      strategy: 'autoHeight',
    },
  })

  const hasTextSelectionRange = computed(() => {
    return (textSelection.value?.length ?? 0) > 1
      && textSelection.value![0] !== textSelection.value![1]
  })

  const isTextAllSelected = computed(() => {
    return textSelection.value?.[0].isFirst
      && textSelection.value?.[1].isLast
      && textSelection.value?.[1].isLastSelected
  })

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
          fonts,
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

      element.requestRender()
    }

    _handle(element)
    element.findOne((descendant) => {
      if (isElement(descendant)) {
        _handle(descendant)
      }
      return false
    })
  }

  function textToFit(
    element: Element2D,
    strategy = config.value.strategy,
  ): void {
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

      const isVertical = element.text.base.isVertical

      const style = element.style.toJSON()

      switch (strategy) {
        case 'autoWidth':
          if (isVertical) {
            style.height = 'auto'
          }
          else {
            style.width = 'auto'
          }
          break
        case 'autoHeight':
          if (isVertical) {
            style.width = 'auto'
          }
          else {
            style.height = 'auto'
          }
          break
      }

      const { boundingBox } = measureText({
        fonts,
        style,
        content: element.text.content,
      })

      if (
        element.style.width !== boundingBox.width
        || element.style.height !== boundingBox.height
      ) {
        element.style.width = boundingBox.width
        element.style.height = boundingBox.height
        element.requestRender()
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

  function handleTextSelection([start, end]: IndexCharacter[], cb: (arg: Record<string, any>) => boolean): void {
    let flag = true
    elementSelection.value[0]?.text?.content.forEach((p, pIndex, pItems) => {
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
    const el = elementSelection.value[0]

    if (!el) {
      return undefined
    }

    let value

    switch (key) {
      case 'fill':
      case 'outline':
        value = (el.text as any)[key]
        break
      default:
        value = (el.style as any)[key]
        break
    }

    if (hasTextSelectionRange.value && !isTextAllSelected.value) {
      const selection = textSelection.value
      if (selection && selection[0] && selection[1]) {
        handleTextSelection(selection, ({ selected, fStyle }) => {
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
      const content = el.text.content
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

  function setTextContentByEachFragment(handler: (fragment: NormalizedFragment) => void): void {
    const el = elementSelection.value[0]

    if (!el) {
      return
    }

    // TODO 生成新片段后，textSelection未关联更新
    const newContent: NormalizedTextContent = []
    let newParagraph: NormalizedParagraph = { fragments: [] }
    let newFragment: NormalizedFragment | undefined

    handleTextSelection(textSelection.value!, ({ selected, fIndex, fStyle, fLength, c, cIndex, cLength }) => {
      if (fIndex === 0 && cIndex === 0) {
        newParagraph = { fragments: [] }
        newFragment = undefined
      }
      const style = { ...fStyle }

      if (selected) {
        handler(style)
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
      el.text = { ...el.text.toJSON(), content: newContent }
    }
  }

  function setTextStyle(key: string, value: any): void {
    const el = elementSelection.value[0]

    if (!el) {
      return
    }

    switch (key) {
      case 'writingMode': {
        if (el.style[key] !== value) {
          const { width, height } = el.style
          el.style.width = height
          el.style.height = width
          el.style[key] = value
        }
        break
      }
      default: {
        if (hasTextSelectionRange.value && !isTextAllSelected.value) {
          setTextContentByEachFragment((fragment) => {
            (fragment as any)[key] = value
          })
        }
        else {
          switch (key) {
            case 'fill':
            case 'outline':
              (el.text as any)[key] = value
              break
            default:
              (el.style as any)[key] = value
              break
          }

          el.text.content.forEach((p) => {
            delete (p as any)[key]
            p.fragments.forEach((f) => {
              delete (f as any)[key]
            })
          })

          el.text = el.text.toJSON()
        }

        el.requestDraw()
        textToFit(el)
        break
      }
    }
  }

  function getTextFill(): NormalizedFill | undefined {
    const el = elementSelection.value[0]

    if (!el) {
      return undefined
    }

    let fill
    if (hasTextSelectionRange.value) {
      fill = getTextStyle('fill')
      if (!fill) {
        fill = { color: getTextStyle('color') }
      }
    }

    fill = fill
      ?? el.text.fill
      ?? { color: el.style.color }

    return fill
  }

  function setTextFill(value: NormalizedFill | undefined): void {
    const el = elementSelection.value[0]

    if (!el) {
      return undefined
    }

    if (hasTextSelectionRange.value && value?.color) {
      setTextStyle('fill', value)
    }
    else {
      el.text.fill = value
      if (value?.color) {
        el.style.color = value.color
      }
      el.text.content.forEach((p) => {
        delete p.fill
        delete p.color
        p.fragments.forEach((f) => {
          delete f.fill
          delete f.color
        })
      })
      el.text = {
        ...el.text.toJSON(),
        fill: value,
      }
      el.requestDraw()
    }
  }

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

  Object.assign(editor, {
    hasTextSelectionRange,
    isTextAllSelected,
  })

  return {
    name: 'mce:typography',
    commands: [
      { command: 'addTextElement', handle: addTextElement },
      { command: 'handleTextSelection', handle: handleTextSelection },
      { command: 'textFontSizeToFit', handle: textFontSizeToFit },
      { command: 'textToFit', handle: textToFit },
      { command: 'setTextStyle', handle: setTextStyle },
      { command: 'getTextStyle', handle: getTextStyle },
      { command: 'getTextFill', handle: getTextFill },
      { command: 'setTextFill', handle: setTextFill },
      { command: 'setTextContentByEachFragment', handle: setTextContentByEachFragment },
    ],
    hotkeys: [
      { command: 'activateTool:text', key: 'T' },
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
            if (/\.txt$/i.test(source.name)) {
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
    tools: [
      {
        name: 'text',
        handle: (position) => {
          addTextElement({ position })
          activateTool(undefined)
        },
      },
    ],
    components: [
      { type: 'overlay', component: VueTextEditor },
    ],
    setup: async () => {
      const {
        setDefaultFont,
      } = editor

      onBeforeMount(() => {
        TextEditor.register()
      })

      const defaultFont = getConfig('typography.defaultFont')

      if (defaultFont) {
        await setDefaultFont(defaultFont)
      }
    },
  }
})
