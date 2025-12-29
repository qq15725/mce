import type { NormalizedElement } from 'modern-idoc'
import type { BigeElement } from './types'
import { idGenerator } from 'modern-idoc'
import { parseAnimations } from './animation'
import { convertBackground } from './background'
import { croppingToCropRect } from './cropping'
import { convertImageElementToUrl } from './image'
import { convertShapeElementToShape } from './shape'
import { getStyle } from './style'
import { convertSvgElementToUrl } from './svg'
import { convertTextContent, convertTextEffects, convertTextStyle } from './text'
import { transformToCropRect } from './transform'

const percentageToPx = (per: string) => (Number.parseFloat(per) || 0) / 100

export async function convertElement(
  el: BigeElement,
  parent: Record<string, any> | undefined,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const { children: _children, ...raw } = el

  const oldStyle = getStyle(el)
  const style = getStyle(el, true)

  const meta: Record<string, any> = {
    raw,
    inPptIs: 'Shape',
    inEditorIs: 'Element',
  }

  const element: NormalizedElement = {
    id: idGenerator(),
    name: el.name ?? el.title,
    style,
    meta,
    children: [],
    background: convertBackground(el),
  }

  if (oldStyle.borderRadius) {
    style.borderRadius = (oldStyle.borderRadius * 0.01) * Math.max(oldStyle.height, oldStyle.width)
  }

  if (parent) {
    if (el.groupStyle) {
      // new version
      style.width = parent.style.width * percentageToPx(el.groupStyle.width)
      style.height = parent.style.height * percentageToPx(el.groupStyle.height)
      style.left = parent.style.width * percentageToPx(el.groupStyle.left)
      style.top = parent.style.height * percentageToPx(el.groupStyle.top)
    }
    else {
      // old version
      style.left = oldStyle.left - parent.left
      style.top = oldStyle.top - parent.top
    }
  }

  if (el.editable === false) {
    style.visibility = 'hidden'
  }

  if (el.lock === true) {
    meta.lock = true
  }

  if (el.animations?.length) {
    const parsed = parseAnimations(el)
    ;(element as any).delay = parsed.delay
    ;(element as any).duration = parsed.duration
    element.children!.push(...parsed.animations as any)
    if (context) {
      parsed.animations.forEach((animation) => {
        context.endTime = Math.max(
          context.endTime,
          parsed.delay + animation.delay + animation.duration,
        )
      })
      context.endTime = Math.max(context.endTime, parsed.delay + parsed.duration)
    }
  }

  switch (el.type) {
    case 'image':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Picture'
      meta.lockAspectRatio = true
      element.foreground = {
        image: await convertImageElementToUrl(el),
        fillWithShape: true,
      }
      if (el.clipUrl) {
        meta.rawForegroundImage = el.url
      }
      if (el.cropping) {
        element.foreground.cropRect = croppingToCropRect(
          el.cropping,
          el.style.width,
          el.style.height,
        )
      }
      else if (el.transform) {
        element.foreground.cropRect = transformToCropRect(
          el.transform,
          el.style.width,
          el.style.height,
        )
      }
      break
    case 'svg': {
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Picture'
      meta.lockAspectRatio = true
      element.foreground = {
        image: await convertSvgElementToUrl(el),
        fillWithShape: true,
      }
      break
    }
    case 'text': {
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Shape'
      if (style.writingMode === 'horizontal-tb') {
        style.width = Math.ceil(style.width + style.letterSpacing)
      }
      else {
        style.height = Math.ceil(style.height + style.letterSpacing)
      }
      element.style = {
        ...style,
        ...(await convertTextStyle(el)),
      }
      element.text = {
        content: await convertTextContent(el),
        effects: await convertTextEffects(el),
        // plugins: [deformation(el.deformation?.type?.endsWith("byWord") ? -1 : 999, () => el.deformation)],
      } as any
      break
    }
    case 'com':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'GroupShape'
      element.children!.push(
        ...(
          await Promise.all(
            el.children.map(async (child: any) => {
              try {
                return await convertElement(child, el, context)
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
    case 'anim':
      meta.inCanvasIs = 'Lottie2D'
      ;(element as any).src = el.url
      break
    case 'shape':
      meta.inCanvasIs = 'Element2D'
      meta.inPptIs = 'Shape'
      element.shape = convertShapeElementToShape(el)
      element.fill = { color: el.fill }
      element.outline = {
        color: el.stroke,
        width: el.strokeWidth,
      }
      break
    case 'pic':
    case 'mosaic':
    case 'image_squence':
    case 'background':
    case 'legend':
    case 'ppt':
    case 'wordcloud':
    case 'table':
    case 'echart':
    case 'qrcode':
    case 'latex':
    case 'mindmap':
    case 'flowchart':
    case 'backgroundBlock':
    case 'mask':
    case 'video':
    case 'watermark':
    case 'collage':
    case 'imageWall':
    default:
      console.warn(el)
      break
  }
  return element
}
