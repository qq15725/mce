import type { Element2D } from 'modern-canvas'
import type { NormalizedStyle, NormalizedText } from 'modern-idoc'
import { getDefaultTextStyle } from 'modern-idoc'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      formatPaint: () => void
      applyFormatPaint: (targets?: Element2D[]) => void
      exitFormatPaint: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    elementSelection,
    exec,
    state,
  } = editor

  let source: NormalizedText | undefined

  function activateFormatPaint() {
    const el = elementSelection.value?.[0]
    if (!el?.text?.textContent) {
      return
    }
    const text = el.text
    const fill = exec('getTextFill')
    // 文本样式的真值源是 el.style（getTextStyle/setTextStyle 均以此为准），
    // 故以 getDefaultTextStyle() 的键集合作为字段白名单，逐项取其有效值
    // （getTextStyle 已含文本选区/片段聚合逻辑），跳过未设置字段以免污染 source。
    const style = (Object.keys(getDefaultTextStyle()) as (keyof NormalizedStyle)[])
      .reduce((acc, field) => {
        const value = exec('getTextStyle', field)
        if (value !== undefined) {
          acc[field] = value
        }
        return acc
      }, {} as Partial<NormalizedStyle>)
    source = {
      ...text,
      fill,
      style,
    }
    exec('setState', 'painting')
    elementSelection.value = []
  }

  function applyFormatPaint(targets = elementSelection.value) {
    if (!source)
      return
    targets.forEach((target) => {
      if (target.text?.textContent) {
        target.text = {
          ...source,
          content: [
            {
              fragments: [
                { content: target.text.textContent },
              ],
            },
          ],
        }
        exec('textToFit', target)
      }
    })
  }

  function exitFormatPaint() {
    source = undefined
    state.value === 'painting' && exec('setState', undefined)
  }

  return {
    name: 'mce:formatPaint',
    commands: [
      { command: 'formatPaint', handle: activateFormatPaint },
      { command: 'applyFormatPaint', handle: applyFormatPaint },
      { command: 'exitFormatPaint', handle: exitFormatPaint },
    ],
    hotkeys: [
      { command: 'formatPaint', key: 'CmdOrCtrl+F', when: () => elementSelection.value[0]?.text },
    ],
  }
})
