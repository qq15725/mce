import { normalizeNumber } from 'modern-idoc'

// 数值型样式若取到空字符串等无效值（后端脏数据），会污染下游 modern-text 布局，
// 典型如 textIndent:'' 会让布局里的 `x = left + textIndent` 退化成字符串拼接（54 + '' => '54'），
// 导致文字坐标错乱、整页排版崩坏。这里统一归一化，剔除无效值后由下游回退默认。
const NUMERIC_STYLE_KEYS = [
  'textIndent',
  'lineHeight',
  'letterSpacing',
  'wordSpacing',
  'fontSize',
  'textStrokeWidth',
  'borderRadius',
  'opacity',
  'rotate',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
  'translateX',
  'translateY',
]

export function getStyle(el: Record<string, any>, clone = false) {
  let style = el.style ?? el

  if (clone) {
    style = { ...style }

    // common
    delete style.right
    delete style.bottom
    delete style.transform

    // layout
    delete style.backgroundColor
    delete style.backgroundImage
    delete style.backgroundImageOpacity
    delete style.backgroundPosition
    delete style.backgroundSize
    delete style.backgroundTransform
    delete style.backgroundUrl
    delete style.elements
    delete style.imageTransform

    // numeric
    for (const key of NUMERIC_STYLE_KEYS) {
      if (key in style) {
        const value = normalizeNumber(style[key])
        if (value === undefined) {
          delete style[key]
        }
        else {
          style[key] = value
        }
      }
    }
  }

  return style
}
