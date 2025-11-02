import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { parseAnimations } from './animation'
import { convertImageElementToUrl } from './image'
import { convertSvgElementToUrl } from './svg'
import { convertTextContent, convertTextEffects, convertTextStyle } from './text'

const percentageToPx = (per: string) => (Number.parseFloat(per) || 0) / 100

export async function convertElement(
  el: Record<string, any>,
  parent: Record<string, any> | undefined,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const style = { ...(el.style ?? el) }

  delete style.bottom
  delete style.right

  const meta: Record<string, any> = {
    inPptIs: 'Shape',
    inEditorIs: 'Element',
  }
  if (el.id) {
    meta.rawId = el.id
  }
  if (el.name) {
    meta.rawName = el.name
  }

  const element: NormalizedElement = {
    id: idGenerator(),
    name: el.name ?? el.title ?? el.id,
    style,
    meta,
    children: [],
  }

  if (style.borderRadius) {
    style.borderRadius = (style.borderRadius * 0.01) * Math.max(style.height, style.width)
  }

  if (parent && el.groupStyle) {
    style.width = parent.style.width * percentageToPx(el.groupStyle.width)
    style.height = parent.style.height * percentageToPx(el.groupStyle.height)
    style.left = parent.style.width * percentageToPx(el.groupStyle.left)
    style.top = parent.style.height * percentageToPx(el.groupStyle.top)
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
      meta.inPptIs = 'Picture'
      element.foreground = {
        image: await convertImageElementToUrl(el),
        fillWithShape: true,
      }
      if (el.clipUrl) {
        meta.rawForegroundImage = el.url
      }
      if (el.cropping) {
        const width = el.style.width
        const height = el.style.height
        const {
          imageWidth,
          imageHeight,
          maskWidth = width,
          maskHeight = height,
          translateX,
          translateY,
          zoom = 1,
        } = el.cropping
        const cvsWidth = imageWidth * zoom
        const cvsHeight = imageHeight * zoom
        const distX = (cvsWidth - maskWidth) / 2 - translateX
        const distY = (cvsHeight - maskHeight) / 2 - translateY
        const originX = distX + maskWidth / 2
        const originY = distY + maskHeight / 2
        const left = -(width / 2 - originX)
        const top = -(height / 2 - originY)
        const right = cvsWidth - (left + width)
        const bottom = cvsHeight - (top + height)
        element.foreground.cropRect = {
          left: left / cvsWidth,
          top: top / cvsHeight,
          right: right / cvsWidth,
          bottom: bottom / cvsHeight,
        }
      }
      break
    case 'svg': {
      meta.inPptIs = 'Picture'
      element.foreground = {
        image: await convertSvgElementToUrl(el),
        fillWithShape: true,
      }
      break
    }
    case 'text': {
      meta.inPptIs = 'Shape'
      if (style.writingMode === 'horizontal-tb') {
        style.width = Math.ceil(style.width + style.letterSpacing)
      }
      else {
        style.height = Math.ceil(style.height + style.letterSpacing)
      }
      element.text = {
        content: await convertTextContent(el),
        style: await convertTextStyle(el),
        effects: await convertTextEffects(el),
        // plugins: [deformation(el.deformation?.type?.endsWith("byWord") ? -1 : 999, () => el.deformation)],
      } as any
      break
    }
    case 'com':
      meta.inPptIs = 'GroupShape'
      element.children = (await Promise.all(
        el.children.map(async (child: any) => {
          try {
            return await convertElement(child, el, context)
          }
          catch (e) {
            console.warn(e)
            return undefined
          }
        }),
      )).filter(Boolean)
      break
    case 'pic':
    case 'mosaic':
    case 'image_squence':
    case 'background':
    case 'anim':
    case 'legend':
    case 'shape':
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
