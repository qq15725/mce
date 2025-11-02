import type { NormalizedBackground, NormalizedElement } from 'modern-idoc'
import { idGenerator, isGradient } from 'modern-idoc'
import { convertElement } from './element'

export async function convertLayout(
  layout: Record<string, any>,
  isFrame = true,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const id = idGenerator()

  const style = {
    ...(layout.style ?? layout),
  }

  delete style.right
  delete style.bottom
  if (isFrame) {
    style.overflow = 'hidden'
  }

  const meta: Record<string, any> = {
    inPptIs: isFrame ? 'Slide' : 'GroupShape',
    inEditorIs: isFrame ? 'Frame' : 'Element',
  }
  if (layout.id) {
    meta.rawId = layout.id
  }
  if (layout.name) {
    meta.rawName = layout.name
  }

  let background: NormalizedBackground | undefined
  if (layout.background) {
    if (layout.background.color) {
      background ??= {}
      if (isGradient(layout.background.color ?? '')) {
        background.image = layout.background.color
      }
      else {
        background.color = layout.background.color
      }
    }
    if (layout.background.image) {
      background ??= {}
      background.image = layout.background.image
    }
  }

  return {
    id,
    name: isFrame ? `Frame ${id}` : layout.name,
    style, // TODO 过滤掉部分属性
    background,
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
