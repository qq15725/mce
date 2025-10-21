import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { parseAnimations } from './animation'
import { convertTextContent, convertTextEffects, convertTextStyle } from './text'

const percentageToPx = (per: string) => (Number.parseFloat(per) || 0) / 100

export async function convertElement(
  el: Record<string, any>,
  parent: Record<string, any> | undefined,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const style = el.style ?? el

  if (style.borderRadius) {
    style.borderRadius = (style.borderRadius * 0.01) * Math.max(style.height, style.width)
  }

  if (parent && el.groupStyle) {
    style.width = parent.style.width * percentageToPx(el.groupStyle.width)
    style.height = parent.style.height * percentageToPx(el.groupStyle.height)
    style.left = parent.style.width * percentageToPx(el.groupStyle.left)
    style.top = parent.style.height * percentageToPx(el.groupStyle.top)
  }

  const element: NormalizedElement = {
    id: idGenerator(),
    name: el.name ?? el.title ?? el.id,
    style, // 过滤掉部分属性
    meta: {
      inPptIs: 'Shape',
      inEditorIs: 'Element',
    },
    children: [],
  }

  if (el.animations?.length) {
    const parsed = parseAnimations(el)
    ;(element as any).delay = parsed.delay
    ;(element as any).duration = parsed.duration
    element.children!.push(...parsed.animations as any)
    if (context) {
      context.endTime = Math.max(context.endTime, parsed.delay + parsed.duration)
    }
  }

  switch (el.type) {
    case 'image':
      element.meta!.inPptIs = 'Picture'
      element.foreground = {
        image: el.url,
        fillWithShape: true,
      }
      if (el.maskUrl) {
        // TODO maskUrl
        // element.style!.maskImage = el.maskUrl
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
      element.meta!.inPptIs = 'Picture'
      let doc = el.doc
      if (!doc) {
        doc = await fetch(el.url).then(rep => rep.text())
      }
      // fix
      doc = doc.replace(new RegExp(`#el-${el.id} `, 'gi'), '')
      doc = doc.replace('width="100%"', `width="${style.width * 2}"`)
      doc = doc.replace('height="100%"', `height="${style.height * 2}"`)
      element.foreground = {
        image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`,
        fillWithShape: true,
      }
      break
    }
    case 'text': {
      element.meta!.inPptIs = 'Shape'
      element.text = {
        content: await convertTextContent(el),
        style: await convertTextStyle(el),
        effects: await convertTextEffects(el),
        // plugins: [deformation(el.deformation?.type?.endsWith("byWord") ? -1 : 999, () => el.deformation)],
      }
      break
    }
    case 'com':
      element.meta!.inPptIs = 'GroupShape'
      element.children = await Promise.all(
        el.children.map((child: any) => convertElement(child, el, context)),
      )
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
