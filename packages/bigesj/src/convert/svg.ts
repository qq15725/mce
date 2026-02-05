import { assets } from 'modern-canvas'
import { convertImageElementToUrl } from './image'

export async function convertSvgElementToUrl(el: Record<string, any>): Promise<string> {
  const {
    id,
    doc,
    url,
    style = {},
    background = {},
  } = el

  let xml = doc
  if (!xml) {
    xml = await fetch(url).then(rep => rep.text())
  }

  const svg = new DOMParser().parseFromString(
    xml
      .replace(new RegExp(`#el-${id} `, 'gi'), '')
      .replace(/data-colors\s/, ' ')
      .replace(/[a-z-]+="([^\s<]*<\S*)"/gi, ''),
    'image/svg+xml',
  ).documentElement as unknown as SVGSVGElement

  if (!(svg instanceof SVGElement)) {
    throw new TypeError(`Failed to DOMParser, parse svg to DOM error: ${xml}`)
  }

  const images = svg.querySelectorAll('image')
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const url = image.href.baseVal
    if (!url.startsWith('http')) {
      continue
    }
    image?.setAttribute(
      'href',
      await assets.fetchImageBitmap(url)
        .then((bitmap) => {
          const canvas = document.createElement('canvas')
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
          bitmap.close()
          return canvas.toDataURL('image/png')
        }),
    )
  }

  // image fill
  if (background.src) {
    const fillId = `#${id}-fill-blip`
    const fillPattern = svg.querySelector(fillId) as SVGPatternElement | undefined
    const fillImage = fillPattern?.querySelector('image') as SVGImageElement | undefined

    if (fillPattern && fillImage) {
      try {
        const base64Url = await assets.fetchImageBitmap(background.src)
          .then((bitmap) => {
            const canvas = document.createElement('canvas')
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
            bitmap.close()
            return canvas.toDataURL('image/png')
          })
        fillImage?.setAttribute('href', base64Url)
        fillPattern?.setAttribute('fill', fillId)
      }
      catch (e) {
        console.error(e)
      }
    }
  }

  if (style.width)
    svg.setAttribute('width', String(style.width * 2))
  if (style.height)
    svg.setAttribute('height', String(style.height * 2))

  return await convertImageElementToUrl({
    ...el,
    transform: {
      ...el.transform,
      originWidth: style.width,
      originHeight: style.height,
    },
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`,
  })
}
