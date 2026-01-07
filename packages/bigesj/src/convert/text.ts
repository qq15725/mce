import type { NormalizedParagraph, NormalizedTextContent, StyleObject } from 'modern-idoc'
import type { BigeElement } from './types'
import { normalizeCRLF } from 'modern-idoc'
import { getStyle } from './style'

const highlightReferImage
  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNzIgNzIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDcyIDcyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBhdGggZD0iTTE5LjMsMzguMWMwLjIsMC41LDAuNCwwLjksMC43LDEuNGMwLjIsMC4zLDAuNCwwLjQsMC44LDAuNGMwLjMsMCwwLjUtMC4xLDAuNi0wLjRjMC4xLTAuMywwLjEtMC42LDAuMi0wLjkgICBjMC0wLjIsMC4xLTAuNCwwLjMtMC41YzAuMi0wLjEsMC40LTAuMiwwLjYtMC4xYzAuMiwwLDAuNCwwLjEsMC41LDAuM2MwLjEsMC4yLDAuMiwwLjQsMC4xLDAuNmMtMC4xLDAuNi0wLjIsMS4yLTAuNCwxLjcgICBjLTAuMywwLjgtMC45LDEuMi0xLjcsMS4yYy0wLjksMC0xLjYtMC40LTIuMS0xLjJjLTAuMy0wLjQtMC41LTAuOC0wLjctMS4zYy0wLjQsMC4zLTEsMC42LTEuNywxYy0wLjUsMC4yLTAuOCwwLjEtMS4xLTAuMyAgIGMtMC4yLTAuNS0wLjEtMC45LDAuMy0xLjFjMC43LTAuNCwxLjQtMC44LDEuOS0xLjFjLTAuMi0wLjktMC40LTIuMS0wLjUtMy43TDE1LjksMzRjLTAuMiwwLTAuNCwwLTAuNi0wLjEgICBjLTAuMi0wLjEtMC4zLTAuMy0wLjMtMC41YzAtMC4yLDAtMC40LDAuMi0wLjZzMC4zLTAuMywwLjUtMC4zbDEuMi0wLjFjLTAuMS0wLjktMC4xLTEuOS0wLjEtMi45YzAtMC4yLDAuMS0wLjQsMC4yLTAuNiAgIGMwLjItMC4xLDAuMy0wLjIsMC42LTAuMmMwLjIsMCwwLjQsMC4xLDAuNiwwLjJjMC4yLDAuMSwwLjIsMC4zLDAuMywwLjZjMCwwLjEsMCwxLDAuMSwyLjdsMy4yLTAuNGMwLjIsMCwwLjQsMCwwLjUsMC4xICAgYzAuMiwwLjEsMC4zLDAuMywwLjMsMC41czAsMC40LTAuMSwwLjVjLTAuMSwwLjItMC4zLDAuMy0wLjUsMC4zbC0zLjMsMC40YzAuMSwxLjIsMC4yLDIuMSwwLjMsMi44YzAuNy0wLjYsMS40LTEuNCwyLTIuMiAgIGMwLjMtMC40LDAuNy0wLjQsMS4xLTAuMmMwLjQsMC4zLDAuNCwwLjcsMC4yLDFDMjEuMywzNi4zLDIwLjQsMzcuMywxOS4zLDM4LjF6IE0yMC42LDMxLjFjLTAuMy0wLjItMC43LTAuNS0xLjEtMC44ICAgYy0wLjMtMC4zLTAuMy0wLjYtMC4xLTAuOWMwLjMtMC4zLDAuNi0wLjQsMS0wLjJjMC40LDAuMiwwLjcsMC41LDEuMSwwLjdjMC40LDAuMywwLjQsMC42LDAuMiwxQzIxLjMsMzEuMywyMSwzMS4zLDIwLjYsMzEuMXogICAgTTIzLjMsMzAuOWMwLTAuMiwwLjEtMC40LDAuMi0wLjVjMC4xLTAuMSwwLjMtMC4yLDAuNi0wLjJzMC40LDAuMSwwLjYsMC4yYzAuMSwwLjEsMC4yLDAuMywwLjIsMC41djYuNWMwLDAuMi0wLjEsMC40LTAuMiwwLjUgICBjLTAuMSwwLjEtMC4zLDAuMi0wLjYsMC4ycy0wLjQtMC4xLTAuNi0wLjJjLTAuMS0wLjEtMC4yLTAuMy0wLjItMC41VjMwLjl6IE0yNC4zLDQxLjZjLTAuMiwwLTAuNC0wLjEtMC42LTAuMiAgIGMtMC4yLTAuMS0wLjItMC4zLTAuMi0wLjZjMC0wLjIsMC4xLTAuNCwwLjItMC42YzAuMi0wLjEsMC4zLTAuMiwwLjYtMC4yaDAuOWMwLjYsMCwxLTAuNCwxLTEuMXYtOS40YzAtMC4yLDAuMS0wLjQsMC4yLTAuNiAgIGMwLjItMC4xLDAuMy0wLjIsMC42LTAuMmMwLjIsMCwwLjQsMC4xLDAuNiwwLjJjMC4yLDAuMSwwLjIsMC4zLDAuMiwwLjZWMzljMCwwLjgtMC4yLDEuNS0wLjcsMS45cy0xLjEsMC43LTEuOCwwLjdIMjQuM3oiLz4KCTxwYXRoIGQ9Ik00MC42LDM3LjdoLTMuOHYwLjdoNC40YzAuMSwwLDAuMywwLjEsMC40LDAuMmMwLjEsMC4xLDAuMiwwLjIsMC4yLDAuNGMwLDAuMS0wLjEsMC4zLTAuMiwwLjRjLTAuMSwwLjEtMC4yLDAuMi0wLjQsMC4yICAgaC00LjR2MC43SDQyYzAuMiwwLDAuMywwLjEsMC40LDAuMmMwLjEsMC4xLDAuMiwwLjIsMC4yLDAuNHMtMC4xLDAuMy0wLjIsMC40Yy0wLjEsMC4xLTAuMiwwLjItMC40LDAuMkgzMGMtMC4yLDAtMC4zLTAuMS0wLjQtMC4yICAgYy0wLjEtMC4xLTAuMi0wLjItMC4yLTAuNHMwLjEtMC4zLDAuMi0wLjRjMC4xLTAuMSwwLjItMC4yLDAuNC0wLjJoNS4ydi0wLjdoLTQuNGMtMC4xLDAtMC4zLTAuMS0wLjQtMC4ycy0wLjItMC4yLTAuMi0wLjQgICBjMC0wLjEsMC4xLTAuMywwLjItMC40czAuMi0wLjIsMC40LTAuMmg0LjR2LTAuN2gtMy43aDBjLTAuMiwwLTAuNC0wLjEtMC42LTAuMnMtMC4yLTAuMy0wLjItMC42di0zLjFjMC0wLjIsMC4xLTAuNCwwLjItMC42ICAgYzAuMS0wLjEsMC4zLTAuMiwwLjYtMC4yaDMuOHYtMC44SDMwYy0wLjIsMC0wLjMtMC4xLTAuNC0wLjJjLTAuMS0wLjEtMC4yLTAuMi0wLjItMC40czAuMS0wLjMsMC4yLTAuNGMwLjEtMC4xLDAuMi0wLjIsMC40LTAuMiAgIGg1LjJ2LTAuOGMtMS40LDAtMi45LDAuMS00LjMsMC4xYy0wLjIsMC0wLjMsMC0wLjQtMC4xYy0wLjEtMC4xLTAuMi0wLjItMC4yLTAuNGMwLTAuMiwwLTAuMywwLjItMC40YzAuMS0wLjEsMC4zLTAuMiwwLjQtMC4yICAgYzMuMywwLDYuOC0wLjEsMTAuMi0wLjNjMC4yLDAsMC4zLDAsMC40LDAuMmMwLjEsMC4xLDAuMiwwLjMsMC4yLDAuNGMwLDAuMiwwLDAuMy0wLjEsMC40Yy0wLjEsMC4xLTAuMiwwLjItMC40LDAuMiAgIGMtMS4xLDAtMi41LDAuMS00LjMsMC4xdjAuOGg1LjFjMC4yLDAsMC4zLDAuMSwwLjQsMC4yYzAuMSwwLjEsMC4yLDAuMiwwLjIsMC40cy0wLjEsMC4zLTAuMiwwLjRjLTAuMSwwLjEtMC4yLDAuMi0wLjQsMC4yaC01LjEgICB2MC44aDMuOGMwLjIsMCwwLjQsMC4xLDAuNiwwLjJjMC4xLDAuMSwwLjIsMC4zLDAuMiwwLjZ2My4xYzAsMC4yLTAuMSwwLjQtMC4yLDAuNkM0MSwzNy43LDQwLjgsMzcuNyw0MC42LDM3Ljd6IE0zNS4xLDM0LjlWMzQgICBoLTIuOXYwLjlIMzUuMXogTTM1LjEsMzYuN3YtMC45aC0yLjl2MC45SDM1LjF6IE0zOS44LDM0LjlWMzRoLTIuOXYwLjlIMzkuOHogTTM5LjgsMzYuN3YtMC45aC0yLjl2MC45SDM5Ljh6Ii8+Cgk8cGF0aCBkPSJNNDUuNSw0MS4xYy0wLjMsMC40LTAuNywwLjUtMS4xLDAuM2MtMC40LTAuMy0wLjUtMC43LTAuMy0xLjFsMS0xLjdjMC4zLTAuNCwwLjctMC41LDEuMS0wLjNjMC40LDAuMywwLjUsMC43LDAuMywxLjEgICBMNDUuNSw0MS4xeiBNNTUsMzcuN2MtMC4xLDAtMC4xLDAtMC4yLDBoLTguOWMtMC4zLDAtMC41LTAuMS0wLjYtMC4yYy0wLjItMC4yLTAuMi0wLjQtMC4yLTAuNnYtMy40YzAtMC4yLDAuMS0wLjQsMC4yLTAuNiAgIGMwLjEtMC4xLDAuMy0wLjIsMC42LTAuMmgzLjN2LTMuMWMwLTAuMiwwLjEtMC40LDAuMi0wLjZjMC4yLTAuMiwwLjQtMC4yLDAuNi0wLjJzMC40LDAuMSwwLjYsMC4yYzAuMiwwLjIsMC4yLDAuNCwwLjIsMC42djAuM0g1NiAgIGMwLjIsMCwwLjQsMC4xLDAuNiwwLjJjMC4xLDAuMSwwLjIsMC4zLDAuMiwwLjZzLTAuMSwwLjQtMC4yLDAuNWMtMC4xLDAuMS0wLjMsMC4yLTAuNiwwLjJoLTUuMnYxLjNoNGMwLjIsMCwwLjQsMC4xLDAuNiwwLjIgICBjMC4xLDAuMSwwLjIsMC4zLDAuMiwwLjZ2My40QzU1LjYsMzcuMyw1NS40LDM3LjYsNTUsMzcuN3ogTTUzLjksMzYuMnYtMmgtNy4xdjJINTMuOXogTTQ5LjYsNDAuN2MwLDAuMy0wLjEsMC41LTAuMiwwLjYgICBjLTAuMiwwLjEtMC40LDAuMi0wLjYsMC4yYy0wLjIsMC0wLjQtMC4xLTAuNi0wLjJjLTAuMS0wLjItMC4yLTAuNC0wLjItMC42bDAtMS42YzAtMC4yLDAuMS0wLjQsMC4yLTAuNmMwLjItMC4yLDAuMy0wLjIsMC42LTAuMiAgIHMwLjQsMC4xLDAuNiwwLjJjMC4yLDAuMiwwLjIsMC40LDAuMiwwLjZWNDAuN3ogTTUyLjgsNDAuN2MwLDAuMi0wLjEsMC40LTAuMiwwLjZjLTAuMiwwLjEtMC40LDAuMi0wLjYsMC4yICAgYy0wLjIsMC0wLjQtMC4xLTAuNi0wLjJjLTAuMi0wLjEtMC4yLTAuMy0wLjItMC42bDAtMS42YzAtMC4yLDAuMS0wLjQsMC4yLTAuNmMwLjItMC4yLDAuMy0wLjIsMC42LTAuMmMwLjIsMCwwLjQsMC4xLDAuNiwwLjIgICBjMC4yLDAuMiwwLjIsMC40LDAuMiwwLjZWNDAuN3ogTTU2LjYsNDAuM2MwLjIsMC40LDAuMSwwLjgtMC4zLDEuMWMtMC41LDAuMy0wLjgsMC4yLTEuMS0wLjNsLTEtMS43Yy0wLjItMC41LTAuMS0wLjgsMC4zLTEuMSAgIGMwLjUtMC4yLDAuOS0wLjEsMS4xLDAuM0w1Ni42LDQwLjN6Ii8+CjwvZz4KPC9zdmc+'

export function convertTextStyle(
  el: BigeElement,
  isByWord = false,
): Partial<StyleObject> {
  const elStyle = getStyle(el)

  const style: Partial<StyleObject> = {
    highlightReferImage,
    listStyleType: 'none',
    listStyleImage: 'none',
  }

  if (elStyle.fontSize) {
    style.fontSize = Math.floor(elStyle.fontSize)
  }

  if (el.listStyle?.colormap) {
    style.listStyleColormap = el.listStyle?.colormap
  }

  if (!isByWord) {
    if (el.listMode) {
      style.listStyleType = 'disc'
    }
    else if (el.listStyle) {
      style.listStyleImage = el.listStyle.image
      style.listStyleSize = `${el.listStyle.size * 100}%`
    }
  }

  if (el.background?.enabled) {
    style.backgroundImage = el.background.image
    style.backgroundSize = el.background.size
    style.backgroundColormap = el.background.colormap
    style.padding = el.background.padding
  }

  return style
}

export async function convertTextEffects(el: BigeElement): Promise<Partial<StyleObject>[] | undefined> {
  const effects = el.textEffects ?? []
  if (!effects.length) {
    return undefined
  }
  return await Promise.all(
    [...effects].reverse().map(async (effect) => {
      const result: Partial<StyleObject> = {}
      const { offset, skew, stroke, shadow, filling } = effect
      if (offset) {
        result.translateX = offset.x
        result.translateY = offset.y
      }
      if (skew) {
        result.skewX = skew.x
        result.skewY = skew.y
      }
      if (stroke?.color && stroke.width) {
        result.textStrokeWidth = stroke.width
        result.textStrokeColor = stroke.color
      }
      if (shadow) {
        result.shadowOffsetX = shadow.offsetX
        result.shadowOffsetY = shadow.offsetY
        result.shadowBlur = shadow.blur
        result.shadowColor = shadow.color
      }
      if (filling) {
        const { color, imageContent, gradient } = filling
        if (imageContent?.image) {
          // TODO
          // const { image, repeat } = imageContent
        }
        else if (gradient) {
          result.color = `linear-gradient(${90 - gradient.angle}deg, ${gradient.stops.map((stop: any) => `${stop.color} ${stop.offset * 100}%`).join(',')})`
        }
        else if (color) {
          result.color = color
        }
      }
      return result
    }),
  )
}

export function getTextContents(el: BigeElement): BigeElement['contents'] {
  if (el.version) {
    // white-space: pre-wrap
    return el.contents
  }
  // white-space: normal
  return el.contents.map((p: any) => {
    let prevChar: string | undefined
    return p
      .map((f: any, fIndex: number) => {
        let content = f.content as string
        content = content.replace(/ |\r\n|\n\r|[\n\r\t\v]/g, ' ')
        content = content.replace(/<br\/>/g, '\n')
        let newContent = ''
        let cIndex = 0
        for (const char of Array.from(content)) {
          if (fIndex === 0 && cIndex === 0 && char === ' ') {
            // 首行空格移除
          }
          else if (prevChar === ' ' && char === ' ') {
            // 多空格合并
          }
          else {
            newContent += char
          }
          prevChar = char
          cIndex++
        }
        return {
          ...f,
          content: newContent,
        }
      })
      .filter((f: any) => f.content)
  })
}

export function convertTextContent(
  el: BigeElement,
  isByWord = false,
): NormalizedTextContent {
  const bigeContents = getTextContents(el)

  const paragraphs: NormalizedParagraph[] = []
  for (let i = 0, len = bigeContents.length; i < len; i++) {
    const bigeParagraphs = bigeContents[i]
    const paragraph: NormalizedParagraph = {
      fragments: [],
    }
    paragraphs.push(paragraph)
    for (let i = 0, len = bigeParagraphs.length; i < len; i++) {
      const f: Record<string, any> = {}
      const raw = bigeParagraphs[i]
      for (const key in raw) {
        if (key !== 'id' && raw[key] !== '') {
          ;(f as any)[key] = raw[key]
        }
      }

      if (f.fontSize) {
        f.fontSize = Math.floor(f.fontSize)
      }

      f.content = normalizeCRLF(f.content)

      // highlight
      if (f.highlight) {
        if (isByWord) {
          f.highlight.size = 'cover'
        }
        else {
          if (typeof f.highlight.size == 'number') {
            f.highlight.size = `${f.highlight.size}rem`
          }
        }
        if (typeof f.highlight.thickness === 'number') {
          f.highlight.thickness = `${f.highlight.thickness}%`
        }
      }
      delete f.highlightImage
      delete f.highlightReferImage
      delete f.highlightColormap
      delete f.highlightLine
      delete f.highlightSize
      delete f.highlightThickness

      // listStyle
      if (!isByWord) {
        if (f.listMode) {
          paragraph.listStyleType = 'disc'
        }
        else if (f.listStyle) {
          paragraph.listStyleImage = f.listStyle.image
          paragraph.listStyleSize = `${f.listStyle.size * 100}%`
        }
      }

      const prev = paragraph.fragments[paragraph.fragments.length - 1]
      if (
        prev && Object.keys(prev).length === 1 && prev.content
        && Object.keys(f).length === 1 && f.content
      ) {
        prev.content += f.content
      }
      else {
        paragraph.fragments.push(f as any)
      }
    }
  }

  return paragraphs
}
