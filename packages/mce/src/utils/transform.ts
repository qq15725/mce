/**
 * CSS transform 字符串的解析 / 序列化（用于关键帧编辑：WAAPI 风格的 transform 关键帧
 * 拆成可编辑分量，改完再拼回字符串，存储仍是原始 transform 字符串）。纯函数，可单测。
 */

export interface TransformFn {
  name: string
  /** 各参数的数值与单位（如 100 + '%'、-30 + 'deg'、1 + ''）。 */
  args: { value: number, unit: string }[]
}

const FN_RE = /([a-z]\w*)\(([^)]*)\)/gi
const ARG_RE = /^(-?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)$/i

/** 解析 transform 字符串为有序函数列表；保留函数顺序与各参数单位。 */
export function parseTransform(input: string): TransformFn[] {
  const fns: TransformFn[] = []
  for (const m of input.matchAll(FN_RE)) {
    const args = m[2].split(',').map((raw) => {
      const a = ARG_RE.exec(raw.trim())
      return a
        ? { value: Number(a[1]), unit: a[2] ?? '' }
        : { value: 0, unit: raw.trim() }
    })
    fns.push({ name: m[1], args })
  }
  return fns
}

/** 把函数列表拼回 transform 字符串（顺序、单位与解析时一致）。 */
export function serializeTransform(fns: TransformFn[]): string {
  return fns
    .map(f => `${f.name}(${f.args.map(a => `${a.value}${a.unit}`).join(', ')})`)
    .join(' ')
}

/** 单个可编辑分量：定位到某函数的某个参数，带友好标签。 */
export interface TransformField {
  label: string
  value: number
  unit: string
  fnIndex: number
  argIndex: number
}

// 函数名 → 暴露哪些参数（argIndex + 标签）。未列出的参数（如 rotate3d 的轴向、translate 的 z）隐藏。
const FN_FIELDS: Record<string, [number, string][]> = {
  translate: [[0, 'X'], [1, 'Y']],
  translate3d: [[0, 'X'], [1, 'Y']],
  translateX: [[0, 'X']],
  translateY: [[0, 'Y']],
  scale: [[0, 'scale']],
  scale3d: [[0, 'sx'], [1, 'sy']],
  scaleX: [[0, 'sx']],
  scaleY: [[0, 'sy']],
  rotate: [[0, '°']],
  rotateZ: [[0, '°']],
  rotate3d: [[3, '°']],
  skewX: [[0, 'skewX']],
  skewY: [[0, 'skewY']],
}

/** 从 transform 字符串提取可编辑分量列表（仅暴露有意义的参数）。 */
export function transformFields(fns: TransformFn[]): TransformField[] {
  const out: TransformField[] = []
  fns.forEach((fn, fnIndex) => {
    const spec = FN_FIELDS[fn.name]
    if (!spec)
      return
    for (const [argIndex, label] of spec) {
      const arg = fn.args[argIndex]
      if (arg)
        out.push({ label, value: arg.value, unit: arg.unit, fnIndex, argIndex })
    }
  })
  return out
}

/** 不可变地更新某分量的数值，返回新的 transform 字符串。 */
export function setTransformField(
  fns: TransformFn[],
  fnIndex: number,
  argIndex: number,
  value: number,
): string {
  const next = fns.map((fn, i) =>
    i === fnIndex
      ? { ...fn, args: fn.args.map((a, j) => (j === argIndex ? { ...a, value } : a)) }
      : fn,
  )
  return serializeTransform(next)
}
