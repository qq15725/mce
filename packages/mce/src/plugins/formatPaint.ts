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
  // 阴影是元素级独立属性（el.shadow，与 style/fill/outline 并列），不属于文本样式，
  // 需单独随格式刷带走，否则永远刷不上。
  let sourceShadow: any

  function activateFormatPaint() {
    const el = elementSelection.value?.[0]
    if (!el?.text?.textContent) {
      return
    }
    const text = el.text
    const fill = exec('getTextFill')
    sourceShadow = (el as any).shadow?.toJSON?.()
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
    // 描边(text.outline)与阴影/特效(text.effects)既不在 style 字段内、也不随 ...text 展开带走，
    // 需显式从 toJSON 取，否则格式刷刷不上。注意：本项目文字阴影存在 text.effects[].shadow（非元素级
    // el.shadow），描边存在 text.outline，都在这里补齐。
    const textJson = text.toJSON()
    source = {
      ...text,
      fill,
      style,
      outline: textJson.outline,
      effects: textJson.effects,
    }
    exec('setState', 'painting')
    elementSelection.value = []
  }

  function applyFormatPaint(targets = elementSelection.value) {
    if (!source)
      return
    targets.forEach((target) => {
      if (target.text?.textContent) {
        // 文本样式的真值源是元素 style（描边 textStroke* 等在此；text.style 不生效），
        // 故先把采集到的样式回写到 target.style，再重建文本内容。
        Object.assign(target.style, source!.style)
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
        // 阴影：元素级独立属性，单独复制（含来源无阴影时清空，保持格式一致）。
        if (sourceShadow !== undefined) {
          (target as any).shadow = sourceShadow
        }
        exec('textToFit', target)
      }
    })
  }

  function exitFormatPaint() {
    source = undefined
    sourceShadow = undefined
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
