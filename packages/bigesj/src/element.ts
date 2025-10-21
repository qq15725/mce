import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { parseAnimations } from './animation'

const percentageToPx = (per: string) => (Number.parseFloat(per) || 0) / 100

export async function convertElement(
  bigeElement: Record<string, any>,
  parent: Record<string, any> | undefined,
  context?: {
    endTime: number
  },
): Promise<NormalizedElement> {
  const style = bigeElement.style ?? bigeElement

  if (style.borderRadius) {
    style.borderRadius = (style.borderRadius * 0.01) * Math.max(style.height, style.width)
  }

  if (parent && bigeElement.groupStyle) {
    style.width = parent.style.width * percentageToPx(bigeElement.groupStyle.width)
    style.height = parent.style.height * percentageToPx(bigeElement.groupStyle.height)
    style.left = parent.style.width * percentageToPx(bigeElement.groupStyle.left)
    style.top = parent.style.height * percentageToPx(bigeElement.groupStyle.top)
  }

  const element: NormalizedElement = {
    id: idGenerator(),
    name: bigeElement.name ?? bigeElement.title ?? bigeElement.id,
    style, // 过滤掉部分属性
    meta: {
      inPptIs: 'Shape',
      inEditorIs: 'Element',
    },
    children: [],
  }

  if (bigeElement.animations?.length) {
    const parsed = parseAnimations(bigeElement)
    ;(element as any).delay = parsed.delay
    ;(element as any).duration = parsed.duration
    element.children!.push(...parsed.animations as any)
    if (context) {
      context.endTime = Math.max(context.endTime, parsed.delay + parsed.duration)
    }
  }

  switch (bigeElement.type) {
    case 'image':
      element.meta!.inPptIs = 'Picture'
      element.foreground = {
        image: bigeElement.url,
        fillWithShape: true,
      }
      if (bigeElement.maskUrl) {
        // TODO maskUrl
        // element.style!.maskImage = bigeElement.maskUrl
      }
      if (bigeElement.cropping) {
        const width = bigeElement.style.width
        const height = bigeElement.style.height
        const {
          imageWidth,
          imageHeight,
          maskWidth = width,
          maskHeight = height,
          translateX,
          translateY,
          zoom = 1,
        } = bigeElement.cropping
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
      let doc = bigeElement.doc
      if (!doc) {
        doc = await fetch(bigeElement.url).then(rep => rep.text())
      }
      // fix
      doc = doc.replace(new RegExp(`#el-${bigeElement.id} `, 'gi'), '')
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
        /**
         * 老版 white-space: normal
         * 新版 white-space: pre-wrap
         */
        content: (
          bigeElement.version
            ? bigeElement.contents
            : bigeElement.contents.map((p: any[]) => {
                let prevChar: string | undefined
                return p.map((f: any, fIndex) => {
                  let content = f.content as string
                  // 老逻辑
                  content = content.replace(/ |\r\n|\n\r|[\n\r\t\v]/g, ' ')
                  content = content.replace(/<br\/>/g, '\n')
                  let newContent = ''
                  for (const char of Array.from(content)) {
                    if (fIndex === 0 && char === ' ') {
                    // 首行空格移除
                    }
                    else if (prevChar === ' ' && char === ' ') {
                    // 多空格合并
                    }
                    else {
                      newContent += char
                    }
                    prevChar = char
                  }
                  return {
                    ...f,
                    content: newContent,
                  }
                })
                  .filter(f => f.content)
              })
        ).map((fragments: any) => ({ fragments })),
      }
      break
    }
    case 'com':
      element.meta!.inPptIs = 'GroupShape'
      element.children = await Promise.all(
        bigeElement.children.map((child: any) => convertElement(child, bigeElement, context)),
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
      console.warn(bigeElement)
      break
  }
  return element
}
