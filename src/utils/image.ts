interface ImgSize { width: number, height: number }

interface Options {
  useCrossOrigin?: boolean
  timeout?: number
}

export function getImageSizeFromUrl(
  url: string,
  opts: Options = {},
): Promise<ImgSize> {
  const { useCrossOrigin = false, timeout } = opts

  return new Promise<ImgSize>((resolve, reject) => {
    if (!url)
      return reject(new Error('empty url'))

    const img = new Image()

    if (useCrossOrigin)
      img.crossOrigin = 'Anonymous'

    let timer: number | undefined
    if (typeof timeout === 'number' && timeout > 0) {
      timer = window.setTimeout(() => {
        img.onload = null
        img.onerror = null
        reject(new Error(`image load timeout (${timeout} ms)`))
      }, timeout)
    }

    img.onload = function () {
      if (timer)
        clearTimeout(timer)
      const w = (this as HTMLImageElement).naturalWidth
      const h = (this as HTMLImageElement).naturalHeight
      if (!w || !h) {
        reject(new Error('failed to read natural size'))
      }
      else {
        resolve({ width: w, height: h })
      }
    }

    img.onerror = function () {
      if (timer)
        clearTimeout(timer)
      reject(new Error(`failed to load image: ${url}`))
    }

    img.src = url
  })
}
