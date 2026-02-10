import type { Element2D } from 'modern-canvas'
import type { NormalizedStyle, NormalizedText } from 'modern-idoc'
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
    if (!elementSelection.value?.[0]?.text?.textContent) {
      return
    }
    const text = elementSelection.value[0].text
    const fill = exec('getTextFill')
    // TODO 获取文本选区所有样式值
    const excludes: (keyof NormalizedStyle)[] = ['left', 'top', 'width', 'height']
    const fields = (Object.keys(text.style ?? {}) as (keyof NormalizedStyle)[]).filter(key => !excludes.includes(key))
    const style = fields.reduce((acc, field) => ({ ...acc, [field]: exec('getTextStyle', field) }), {} as Partial<NormalizedStyle>)
    source = {
      ...text,
      fill,
      style,
    }
    // console.info(text.toJSON(), source.fill, source.style)
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
