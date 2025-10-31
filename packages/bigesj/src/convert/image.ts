import { assets } from 'modern-canvas'

export async function convertImageElementToUrl(el: Record<string, any>): Promise<string> {
  const {
    transform = {},
    style = {},
    maskUrl,
    imageEffects = [],
    imageEffectsRatio = 1,
  } = el

  const url: string = el.clipUrl || el.url

  const {
    translateX = 0,
    translateY = 0,
    zoom = 1,
  } = transform ?? {}

  const {
    scaleX = 1,
    scaleY = 1,
    filter,
  } = style

  if (
    translateX === 0
    && translateY === 0
    && zoom === 1
    && scaleX === 1
    && scaleY === 1
    && !maskUrl
    && !filter
    && !imageEffects.length
  ) {
    return url
  }

  const img = await assets.fetchImageBitmap(url)

  const {
    originWidth = img.width,
    originHeight = img.height,
    imageWidth = originWidth as any,
    imageHeight = originHeight as any,
  } = transform

  const {
    width = originWidth,
    height = originHeight,
  } = style

  const dpr = window.devicePixelRatio || 1

  // canvas
  const [canvas, ctx] = createCanvas(width, height, dpr)

  // filter
  if (filter)
    ctx.filter = filter

  // scaleX scaleY
  ctx.scale(scaleX, scaleY)
  ctx.translate(scaleX < 0 ? -width : 0, scaleY < 0 ? -height : 0)

  // maskUrl
  if (maskUrl) {
    const mask = await assets.fetchImageBitmap(maskUrl)
    ctx.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, width, height)
    mask.close()
    ctx.globalCompositeOperation = 'source-in'
  }

  // draw
  const dw = imageWidth * zoom
  const dh = imageHeight * zoom
  const dx = -(dw / 2 - imageWidth / 2) + translateX
  const dy = -(dh / 2 - imageHeight / 2) + translateY
  ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh)
  img.close()

  // reset
  ctx.globalCompositeOperation = 'source-over'

  // imageEffects
  if (imageEffects.length > 0) {
    const scale = 0.9
    const center = {
      x: (width - width * scale) / 2,
      y: (height - height * scale) / 2,
    }
    const canvasBitmap = await createImageBitmap(canvas)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(scale, scale)
    for (let i = imageEffects.length - 1; i >= 0; i--) {
      const { filling, offset, stroke } = imageEffects[i]
      let effectCanvas: any = canvasBitmap

      if (filling) {
        const [canvas1, ctx1] = createCanvas(width, height, dpr)
        ctx1.drawImage(effectCanvas, 0, 0, width, height)
        ctx1.globalCompositeOperation = 'source-in'
        if (filling.color) {
          const [canvas2, ctx2] = createCanvas(width, height, dpr)
          ctx2.fillStyle = filling.color
          ctx2.fillRect(0, 0, width, height)
          ctx1.drawImage(canvas2, 0, 0, width, height)
        }
        else if (filling.imageContent?.image) {
          const img2 = await assets.fetchImageBitmap(filling.imageContent.image)
          ctx1.drawImage(img2, 0, 0, width, height)
          img2.close()
        }
        effectCanvas = canvas1
      }

      stroke?.forEach(({ width, color }: any) => {
        effectCanvas = new ImageStroke()
          .use((ctx: CanvasRenderingContext2D, image: any, options: any) => {
            const [, ctx1] = createCanvas(image.width, image.height)
            ctx1.drawImage(image, 0, 0)
            const paths = getContours(ctx1)
            const x = options.thickness
            const y = options.thickness
            ctx.strokeStyle = options.color
            ctx.lineWidth = options.thickness * 2
            ctx.lineJoin = 'round'
            paths.forEach((path) => {
              ctx.beginPath()
              ctx.moveTo(x + path[0].x, y + path[1].y)
              for (let i = 1; i < path.length; i++) {
                ctx.lineTo(x + path[i].x, y + path[i].y)
              }
              ctx.closePath()
            })
            ctx.stroke()
          })
          .make(effectCanvas, {
            color,
            thickness: (width / 50) * imageEffectsRatio,
          })
      })

      if (offset) {
        let { x, y } = offset
        x = (x / 50) * imageEffectsRatio * 200
        y = (y / 50) * imageEffectsRatio * 200
        ctx.drawImage(effectCanvas, x + center.x, y + center.y, width, height)
      }
      else {
        ctx.drawImage(effectCanvas, center.x, center.y, width, height)
      }
    }
    canvasBitmap.close()
  }

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      try {
        resolve(URL.createObjectURL(blob!))
      }
      catch (e) {
        console.error(`Failed to URL.createObjectURL, url: ${url}`, e)
        resolve(url)
      }
    })
  })
}

function createCanvas(width: number, height: number, ratio = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')!
  ctx.scale(ratio, ratio)
  return [canvas, ctx] as const
}

class ImageStroke {
  canvas = document.createElement('canvas')
  method: any

  use(method: any) {
    this.method = method
    return this
  }

  make(image: any, options: any) {
    const { canvas } = this
    const ctx = this.canvas.getContext('2d')!
    const strokeSize = options.thickness * 2
    const [resultWidth, resultHeight] = [image.width, image.height].map(val => val + strokeSize)
    if (resultWidth !== canvas.width || resultHeight !== canvas.height) {
      canvas.width = resultWidth
      canvas.height = resultHeight
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    this.method(ctx, image, options)
    ctx.drawImage(image, options.thickness, options.thickness)
    return canvas
  }
}

// inspired by https://github.com/OSUblake/msqr/tree/master/npm
function getContours(ctx: CanvasRenderingContext2D) {
  const cx = 0
  const cy = 0
  const canvasWidth = ctx.canvas.width
  const canvasHeight = ctx.canvas.height
  const paths: Array<Array<{ x: number, y: number }>> = []
  let lastPos = 3
  const alpha = 100
  const trace = () => {
    const path: Array<{ x: number, y: number }> = []
    const data = new Uint32Array(ctx.getImageData(cx, cy, canvasWidth, canvasHeight).data.buffer)
    let x
    let y
    let startX
    let startY
    let startPos = -1
    let step
    let prevStep = 9
    const steps = [9, 0, 3, 3, 2, 0, 9, 3, 1, 9, 1, 1, 2, 0, 2, 9]
    let time = 50
    function getState(x: number, y: number) {
      return x >= 0 && y >= 0 && x < canvasWidth && y < canvasHeight
        ? data[y * canvasWidth + x] >>> 24 > alpha
        : false
    }
    function getNextStep(x: number, y: number) {
      let v = 0
      if (getState(x - 1, y - 1)) {
        v += 1
      }
      if (getState(x, y - 1)) {
        v += 2
      }
      if (getState(x - 1, y)) {
        v += 4
      }
      if (getState(x, y)) {
        v += 8
      }
      if (time > 50) {
        time += 10
      }
      else {
        time += 10
      }
      if (v === 6)
        return prevStep === 0 ? 2 : 3
      else if (v === 9)
        return prevStep === 3 ? 0 : 1
      else
        return steps[v]
    }
    for (let i = lastPos; i < data.length; i++) {
      if (data[i] >>> 24 > alpha) {
        startPos = lastPos = i
        break
      }
    }
    if (startPos >= 0) {
      x = startX = startPos % canvasWidth
      y = startY = Math.floor(startPos / canvasWidth)
      do {
        step = getNextStep(x, y)
        if (step === 0)
          y--
        else if (step === 1)
          y++
        else if (step === 2)
          x--
        else if (step === 3)
          x++
        if (step !== prevStep) {
          path.push({ x: x + cx, y: y + cy })
          prevStep = step
        }
      } while (x !== startX || y !== startY)
    }
    paths.push(path)
    return path
  }
  trace()
  return paths
}
