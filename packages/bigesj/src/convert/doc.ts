import type { NormalizedDocument } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { convertLayout } from './layout'

export async function convertDoc(doc: Record<string, any>, gap = 0): Promise<NormalizedDocument> {
  const {
    layouts,
    metas = {},
  } = doc

  const context = {
    endTime: 0,
  }

  let children = await Promise.all(
    layouts.map(async (layout: any, index: number) => {
      return {
        index,
        element: await convertLayout(layout, true, context),
      }
    }),
  )

  let top = 0
  children = children
    .sort((a, b) => a.index - b.index)
    .map((v, index) => {
      const element = v.element
      if (element.style) {
        element.style.top = top
        top += Number(element.style.height) + gap
      }
      element.name = `页面 ${index + 1}`
      return element
    })

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
    name: metas.name || 'doc',
    style: {
      width: metas?.width ?? minmax.maxX - minmax.minX,
      height: metas?.height ?? minmax.maxY - minmax.minY,
    },
    children,
    meta: {
      ...metas,
      endTime: context.endTime,
      inEditorIs: 'Doc',
    },
  } as NormalizedDocument
}
