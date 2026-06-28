import type { ImagePipeline, PipelineImage } from 'modern-idoc'
import { assets, createHTMLCanvas } from 'modern-canvas'

/**
 * 图片处理管线（外部可注册）：把图片像素处理成新的图片像素（`image → image`）。
 *
 * 数据只记录管线名与参数（`ImageFill.pipelines`），处理函数为运行时注册的黑盒，
 * 不入持久化数据。渲染端经引擎注入的解析器烘焙到运行时纹理；不过引擎的导出端
 * （pdf/svg/pptx）经 `materializePipelines` 物化成成品图。
 */
export interface Pipeline {
  /** 唯一名，对应数据 `pipelines[].name`。 */
  name: string
  /** 显示名 i18n key（可选），供 UI 列表使用。 */
  label?: string
  /** 处理函数：接收图片像素 + 参数，返回处理后的像素，可异步。 */
  process: (image: PipelineImage, params?: Record<string, any>) => PipelineImage | Promise<PipelineImage>
}

/** 把图片地址独立解码为中立像素结构。 */
async function imageToPipelineImage(url: string): Promise<PipelineImage | undefined> {
  const bitmap = await assets.fetchImageBitmap(url) as unknown as CanvasImageSource & { width: number, height: number }
  const w = Math.max(1, Math.round(bitmap.width))
  const h = Math.max(1, Math.round(bitmap.height))
  const canvas = createHTMLCanvas(w, h)
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx)
    return undefined
  ctx.drawImage(bitmap, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  return { data: imageData.data, width: w, height: h }
}

/** 把中立像素结构编码为 PNG dataURI。 */
function pipelineImageToDataURL(image: PipelineImage): string | undefined {
  const w = Math.max(1, Math.round(image.width))
  const h = Math.max(1, Math.round(image.height))
  const canvas = createHTMLCanvas(w, h)
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx)
    return undefined
  const imageData = ctx.createImageData(w, h)
  imageData.data.set(image.data)
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

type PipelineResolver = (steps: ImagePipeline[], image: PipelineImage) => Promise<PipelineImage>

/** 形如 `{ image, pipelines }` 的图片填充对象。 */
function isPipelineFill(obj: any): obj is { image: string, pipelines: ImagePipeline[] } {
  return obj
    && typeof obj === 'object'
    && typeof obj.image === 'string'
    && Array.isArray(obj.pipelines)
    && obj.pipelines.length > 0
}

/**
 * 导出前物化：深度遍历文档，把所有带 `pipelines` 的图片填充跑一遍管线，
 * 结果写回 `image`（PNG dataURI）并删除 `pipelines` 字段。这样数据解析类导出器
 * （pdf/svg/pptx）只看到普通图片填充，无需各自实现管线逻辑，跨端一致。
 *
 * 注意：原地修改传入的 `doc`（导出链路里 `doc` 已是 `toJSON` 出的独立快照）。
 */
export async function materializePipelines(doc: any, resolve: PipelineResolver): Promise<void> {
  const fills: { image: string, pipelines: ImagePipeline[] }[] = []
  const seen = new Set<any>()
  const visit = (node: any): void => {
    if (!node || typeof node !== 'object' || seen.has(node))
      return
    seen.add(node)
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (isPipelineFill(node))
      fills.push(node)
    for (const key in node)
      visit(node[key])
  }
  visit(doc)

  await Promise.all(fills.map(async (fill) => {
    const source = await imageToPipelineImage(fill.image)
    if (!source)
      return
    const out = await resolve(fill.pipelines, source)
    const dataURL = pipelineImageToDataURL(out)
    if (dataURL)
      fill.image = dataURL
    delete (fill as any).pipelines
  }))
}
