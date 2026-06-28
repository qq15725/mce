import type { Pipeline } from 'mce'
import type { NormalizedEffect, NormalizedFill, NormalizedGradientFill, PipelineImage } from 'modern-idoc'
import { assets, createHTMLCanvas, SUPPORTS_IMAGE_BITMAP } from 'modern-canvas'

/**
 * 内置「图片效果」管线名。bige「图片样式」（描边/阴影/重上色）转换时生成该名步骤，
 * params 为 `{ effects }`；本包注册同名管线还原其像素效果。
 */
export const IMAGE_EFFECT_PIPELINE = 'imageEffect'

type Drawable = CanvasImageSource & { width: number, height: number }

function ctxOf(cvs: HTMLCanvasElement): CanvasRenderingContext2D {
  return cvs.getContext('2d')!
}

/** 由角度+色标构造 canvas 线性渐变 */
function makeLinearGradient(ctx: CanvasRenderingContext2D, grad: NormalizedGradientFill['linearGradient'], w: number, h: number): CanvasGradient {
  const angle = ((grad?.angle ?? 0) * Math.PI) / 180
  const cx = w / 2
  const cy = h / 2
  const len = (Math.abs(Math.cos(angle)) * w + Math.abs(Math.sin(angle)) * h) / 2
  const dx = Math.cos(angle) * len
  const dy = Math.sin(angle) * len
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
  for (const stop of grad?.stops ?? []) {
    g.addColorStop(Math.min(1, Math.max(0, stop.offset)), stop.color)
  }
  return g
}

/** 用 fill 给 source 的 alpha 轮廓重上色（source-in） */
function fillSilhouette(source: Drawable, w: number, h: number, fill: NormalizedFill, patterns: Record<string, Drawable>): Drawable {
  const cvs = createHTMLCanvas(w, h)!
  const ctx = ctxOf(cvs)
  ctx.drawImage(source, 0, 0, w, h)
  ctx.globalCompositeOperation = 'source-in'
  if (fill.linearGradient) {
    ctx.fillStyle = makeLinearGradient(ctx, fill.linearGradient, w, h)
    ctx.fillRect(0, 0, w, h)
  }
  else if (fill.image && patterns[fill.image]) {
    ctx.drawImage(patterns[fill.image], 0, 0, w, h)
  }
  else if (fill.color) {
    ctx.fillStyle = fill.color
    ctx.fillRect(0, 0, w, h)
  }
  return cvs
}

/**
 * 沿 alpha 轮廓描边（偏移多份拷贝近似，无需轮廓追踪）。
 * 描边铺底、原图盖上，结果尺寸不变。
 */
function strokeSilhouette(source: Drawable, w: number, h: number, width: number, color: string): Drawable {
  const ring = createHTMLCanvas(w, h)!
  const rctx = ctxOf(ring)
  const steps = Math.max(8, Math.ceil(width) * 2)
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    rctx.drawImage(source, Math.cos(a) * width, Math.sin(a) * width, w, h)
  }
  rctx.globalCompositeOperation = 'source-in'
  rctx.fillStyle = color
  rctx.fillRect(0, 0, w, h)

  const out = createHTMLCanvas(w, h)!
  const octx = ctxOf(out)
  octx.drawImage(ring, 0, 0)
  octx.drawImage(source, 0, 0, w, h)
  return out
}

/** 从 CSS transform 字符串解析平移量（仅 translate / translateX / translateY） */
function parseTranslate(transform?: string): { x: number, y: number } {
  let x = 0
  let y = 0
  if (!transform)
    return { x, y }
  const t = transform.match(/translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/)
  if (t) {
    x = Number.parseFloat(t[1])
    y = Number.parseFloat(t[2])
  }
  const tx = transform.match(/translateX\(\s*(-?[\d.]+)/)
  if (tx)
    x = Number.parseFloat(tx[1])
  const ty = transform.match(/translateY\(\s*(-?[\d.]+)/)
  if (ty)
    y = Number.parseFloat(ty[1])
  return { x, y }
}

/**
 * 把 `原图 + effects` 烘焙到一张运行时 canvas。
 * 每层按顺序：fill 重上色 → outline 描边 → 按 transform 位移 / shadow 投影后合成。
 *
 * 合成统一用 destination-over：数组按「前 → 后」堆叠（第 0 层在最上，后续依次落到其后），
 * transform translate 只决定该层落点、不改变堆叠次序。于是「原图层 `{}` 在前 + 位移填充层在后」
 * 即得到「主图在上、彩色副本作为阴影/重影偏移到背后」——与来源编辑器的图片样式一致。
 *
 * 注意：图案填充（fill.image）需异步预加载，未在 patterns 中提供则跳过该填充。
 */
export function bakeImageEffects(
  source: Drawable,
  effects: NormalizedEffect[],
  width: number,
  height: number,
  patterns: Record<string, Drawable> = {},
): HTMLCanvasElement {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))

  // 实心图填满画布时，描边会超出画布被裁、位移阴影被主图盖住而完全不可见（来源编辑器靠把主体内缩留边距解决）。
  // 故按各层最大描边宽 / 位移量内缩主体、四周留出边距，让描边/位移落在可见区（边距上限 20%，防主体过小）。
  let pad = 0
  for (const e of effects) {
    if (e.outline?.width && e.outline.color)
      pad = Math.max(pad, e.outline.width)
    const t = parseTranslate(e.transform)
    pad = Math.max(pad, Math.abs(t.x), Math.abs(t.y))
  }
  pad = Math.min(Math.ceil(pad), Math.floor(Math.min(w, h) * 0.2))
  let base: Drawable = source
  if (pad > 0) {
    const inset = createHTMLCanvas(w, h)!
    ctxOf(inset).drawImage(source, pad, pad, Math.max(1, w - pad * 2), Math.max(1, h - pad * 2))
    base = inset
  }

  const out = createHTMLCanvas(w, h)!
  const ctx = ctxOf(out)

  for (const effect of effects) {
    let layer: Drawable = base

    if (effect.fill && (effect.fill.color || effect.fill.linearGradient || effect.fill.image)) {
      layer = fillSilhouette(layer, w, h, effect.fill, patterns)
    }

    if (effect.outline?.width && effect.outline.color) {
      layer = strokeSilhouette(layer, w, h, effect.outline.width, effect.outline.color)
    }

    const { x, y } = parseTranslate(effect.transform)

    ctx.save()
    // 统一 destination-over：层按数组顺序前→后堆叠，translate 仅决定落点（含位移阴影/重影）。
    ctx.globalCompositeOperation = 'destination-over'
    if (effect.shadow) {
      ctx.shadowColor = effect.shadow.color
      ctx.shadowBlur = effect.shadow.blur ?? 0
      ctx.shadowOffsetX = effect.shadow.offsetX ?? 0
      ctx.shadowOffsetY = effect.shadow.offsetY ?? 0
    }
    ctx.drawImage(layer, x, y, w, h)
    ctx.restore()
  }

  return out
}

/** 把存活图源画进新 canvas（不会被 close） */
function snapshot(source: Drawable): HTMLCanvasElement | undefined {
  const w = Math.max(1, Math.round(source.width))
  const h = Math.max(1, Math.round(source.height))
  const canvas = createHTMLCanvas(w, h)
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx)
    return undefined
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

/** 预解码 effects 里 fill.image 用到的图案（按 url 缓存复用） */
async function resolvePatterns(effects: NormalizedEffect[]): Promise<Record<string, HTMLCanvasElement>> {
  const patterns: Record<string, HTMLCanvasElement> = {}
  for (const effect of effects) {
    const image = (effect.fill as { image?: string } | undefined)?.image
    if (!image || patterns[image])
      continue
    const canvas = await assets.loadBy(`${image}#mc-foreground-pattern`, async () => {
      const bitmap = await assets.fetchImageBitmap(image) as unknown as Drawable
      const c = snapshot(bitmap)
      if (SUPPORTS_IMAGE_BITMAP && bitmap instanceof ImageBitmap)
        bitmap.close()
      return c
    })
    if (canvas)
      patterns[image] = canvas
  }
  return patterns
}

function pipelineImageToCanvas(image: PipelineImage): HTMLCanvasElement | undefined {
  const w = Math.max(1, Math.round(image.width))
  const h = Math.max(1, Math.round(image.height))
  const canvas = createHTMLCanvas(w, h)
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx)
    return undefined
  const imageData = ctx.createImageData(w, h)
  imageData.data.set(image.data)
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function canvasToPipelineImage(canvas: HTMLCanvasElement): PipelineImage | undefined {
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return undefined
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { data: imageData.data, width: canvas.width, height: canvas.height }
}

/**
 * 内置「图片效果」管线：把 bige 图片样式（描边/阴影/重上色，多层 Effect）烘焙进图片。
 * bige 转换时整组 effects 包成单个该名管线步骤，params 为 `{ effects }`。
 */
export const imageEffectPipeline: Pipeline = {
  name: IMAGE_EFFECT_PIPELINE,
  process: async (image, params) => {
    const effects = (params?.effects ?? []) as NormalizedEffect[]
    if (!effects.length)
      return image
    const base = pipelineImageToCanvas(image)
    if (!base)
      return image
    const patterns = await resolvePatterns(effects)
    const out = bakeImageEffects(base, effects, image.width, image.height, patterns)
    return canvasToPipelineImage(out) ?? image
  },
}
