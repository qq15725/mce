import type { NormalizedDocument } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { convertLayout } from './layout'

export interface ConvertDocOptions {
  gap?: number
  included?: number[]
}

export async function convertDoc(
  doc: Record<string, any>,
  options: ConvertDocOptions = {},
): Promise<NormalizedDocument> {
  const {
    gap = 0,
    included,
  } = options

  let data: Record<string, any>
  let raw: Record<string, any> = {}
  if (doc.content) {
    const { content, ...rest } = doc
    raw = rest
    if (typeof content === 'string') {
      data = JSON.parse(content)
    }
    else {
      data = { ...content }
    }
  }
  else {
    data = { ...doc }
  }

  const version = Number(data.version || 1)

  // v2
  if (Number(version) > 1) {
    if (included && data.children) {
      data.children = data.children.filter((_: any, index: number) => included.includes(index))
    }
    return data as NormalizedDocument
  }

  // v1
  let {
    layouts,
  } = data

  const context = {
    endTime: 0,
  }

  if (included) {
    layouts = layouts.filter((_: any, index: number) => included.includes(index))
  }

  let children = await Promise.all(
    layouts.map(async (layout: any, index: number) => {
      return {
        index,
        element: await convertLayout(layout, true, context),
      }
    }),
  )

  // 老数据的 layout 可能自带绝对定位，公众号双封面（cate_id 26 / type 10）就是靠它并排：
  // 头图1 (0,0) 900×383、头图2 (940,0) 500×500，中间空 40px。位置互不相同即视为「数据已排好版」，
  // 原样保留；普通多页作品的 layout 全是 (0,0)、彼此完全重叠，才需要按顺序纵向堆叠开。
  const prePositioned = new Set(
    children.map(v => `${v.element.style?.left ?? 0},${v.element.style?.top ?? 0}`),
  ).size > 1

  let top = 0
  children = children
    .sort((a, b) => a.index - b.index)
    .map((v) => {
      const element = v.element
      if (element.style && !prePositioned) {
        element.style.top = top
        top += Number(element.style.height) + gap
      }
      element.name = `画板 ${v.index + 1}`
      return element
    })
    .reverse()

  const minmax = children.reduce((child) => {
    const left = child.style?.left ?? 0
    const top = child.style?.top ?? 0
    const width = child.style?.width ?? 0
    const height = child.style?.height ?? 0
    return {
      minX: left,
      minY: top,
      maxX: left + width,
      maxY: top + height,
    }
  }, { minX: 0, minY: 0, maxX: 0, maxY: 0 })

  return {
    id: idGenerator(),
    name: raw.name || 'doc',
    style: {
      width: raw?.width ?? minmax.maxX - minmax.minX,
      height: raw?.height ?? minmax.maxY - minmax.minY,
    },
    children,
    meta: {
      raw,
      endTime: context.endTime,
      inEditorIs: 'Doc',
    },
  } as NormalizedDocument
}
