import { cachedFetchImageBitmap } from './image'

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
  // 内嵌图并行处理，避免逐张串行 await 累加延迟
  await Promise.all(Array.from(images).map(async (image) => {
    const url = image.href.baseVal
    if (!url.startsWith('http')) {
      return
    }
    const bitmap = await cachedFetchImageBitmap(url)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    bitmap.close()
    image.setAttribute('href', canvas.toDataURL('image/png'))
  }))

  // image fill
  if (background.src) {
    const fillId = `#${id}-fill-blip`
    const fillPattern = svg.querySelector(fillId) as SVGPatternElement | undefined
    const fillImage = fillPattern?.querySelector('image') as SVGImageElement | undefined

    if (fillPattern && fillImage) {
      try {
        const base64Url = await cachedFetchImageBitmap(background.src)
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

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`
}
