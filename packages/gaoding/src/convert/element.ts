import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'

function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

export async function convertElement(el: any, _parent?: any): Promise<NormalizedElement> {
  const { elements, ...raw } = el

  const style: Record<string, any> = pick(el, [
    'left',
    'top',
    'width',
    'height',
    'opacity',
    'borderRadius',
    // text
    'color',
    'fontFamily',
    'fontStyle',
    'fontWeight',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'textDecoration',
    'writingMode',
    'textAlign',
    'verticalAlign',
    'textIndent',
  ])

  const meta: Record<string, any> = {
    raw,
    inPptIs: 'Shape',
    inEditorIs: 'Element',
  }

  if (el.editable === false || el.hidden === true) {
    style.visibility = 'hidden'
  }

  if (el.lock === true) {
    meta.lock = true
  }

  const element: NormalizedElement = {
    id: idGenerator(),
    name: el.title,
    style,
    meta,
    children: [],
  }

  switch (el.type) {
    case 'text':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Shape'
      element.text = {
        content: el.content,
      }
      break
    case 'image':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Picture'
      meta.lockAspectRatio = true
      element.foreground = {
        image: el.url,
        fillWithShape: true,
      }
      break
    case 'group':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'GroupShape'
      element.children!.push(
        ...(
          await Promise.all(
            elements.map(async (child: any) => {
              try {
                return await convertElement(child, el)
              }
              catch (e) {
                console.warn(e)
                return undefined
              }
            }),
          )
        ),
      )
      break
    case 'path':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Picture'
      meta.lockAspectRatio = true
      element.foreground = {
        image: el.imageUrl,
        fillWithShape: true,
      }
      break
  }

  return element
}
