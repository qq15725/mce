import type { NormalizedBackground, NormalizedElement } from 'modern-idoc'
import { idGenerator, isGradient } from 'modern-idoc'
import { convertElement } from './element'

export async function convertLayout(
  layout: Record<string, any>,
  isPage = true,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const id = idGenerator()

  const style = {
    ...(layout.style ?? layout),
  }

  if (isPage) {
    style.overflow = 'hidden'
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
    name: isPage ? `Frame ${id}` : layout.name,
    style, // TODO 过滤掉部分属性
    background,
    children: await Promise.all(
      layout.elements.map((element: any) => convertElement(element, undefined, context)),
    ),
    meta: {
      inPptIs: isPage ? 'Slide' : 'GroupShape',
      inEditorIs: isPage ? 'Frame' : 'Element',
    },
  } as NormalizedElement
}
