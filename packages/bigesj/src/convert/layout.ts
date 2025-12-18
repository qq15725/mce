import type { NormalizedElement } from 'modern-idoc'
import type { BigeLayout } from './types'
import { idGenerator } from 'modern-idoc'
import { convertBackground } from './background'
import { convertElement } from './element'
import { getStyle } from './style'

export async function convertLayout(
  layout: BigeLayout,
  isFrame = true,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const id = idGenerator()
  const style = { ...getStyle(layout) }

  delete style.right
  delete style.bottom
  if (isFrame) {
    style.overflow = 'hidden'
  }

  const meta: Record<string, any> = {
    inPptIs: isFrame ? 'Slide' : 'GroupShape',
    inEditorIs: isFrame ? 'Frame' : 'Element',
    inCanvasIs: 'Element2D',
  }

  if (layout.id) {
    meta.rawId = layout.id
  }
  if (layout.name) {
    meta.rawName = layout.name
  }

  return {
    id,
    name: isFrame ? `Frame ${id}` : layout.name,
    style, // TODO 过滤掉部分属性
    background: convertBackground(layout),
    children: (await Promise.all(
      layout.elements.map(async (element: any) => {
        try {
          return await convertElement(element, undefined, context)
        }
        catch (e) {
          console.warn(e)
          return undefined
        }
      }),
    )).filter(Boolean),
    meta,
  } as NormalizedElement
}
