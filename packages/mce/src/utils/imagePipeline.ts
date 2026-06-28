import type { PipelineImage } from 'modern-idoc'

/**
 * 图片处理管线（外部可注册）：把图片像素处理成新的图片像素（`image → image`）。
 *
 * 数据只记录管线名与参数（`ImageFill.imagePipelines`），处理函数为运行时注册的黑盒，
 * 不入持久化数据。渲染端经引擎注入的解析器烘焙到运行时纹理；非渲染导出端（pdf/svg/pptx）
 * 由各底层库经注入的同款解析器（`editor.resolveImagePipelines`）在自身嵌入图片时烘焙。
 */
export interface ImagePipeline {
  /** 唯一名，对应数据 `imagePipelines[].name`。 */
  name: string
  /** 显示名 i18n key（可选），供 UI 列表使用。 */
  label?: string
  /** 处理函数：接收图片像素 + 参数，返回处理后的像素，可异步。 */
  process: (image: PipelineImage, params?: Record<string, any>) => PipelineImage | Promise<PipelineImage>
}
