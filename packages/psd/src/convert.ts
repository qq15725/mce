/**
 * PSD → mce 元素的纯转换逻辑（不依赖编辑器 / DOM，便于单测）。
 *
 * 把 PSD 的图层树展平为图片元素（坐标为 PSD 绝对坐标），整体包进一个 Frame 画板。
 * 图层位图如何变成可用 URL 由 `resolveImage` 注入（插件层用 editor.upload，
 * 测试用桩函数）。隐藏图层跳过；组只递归不产出自身节点。
 */

export interface PsdLayerLike {
  name?: string
  left?: number
  top?: number
  right?: number
  bottom?: number
  opacity?: number
  hidden?: boolean
  canvas?: { width: number, height: number }
  children?: PsdLayerLike[]
}

export interface PsdLike {
  name?: string
  width: number
  height: number
  children?: PsdLayerLike[]
}

/** 把一个图层位图解析为 mce 可用的 foreground 来源（URL / blob 等）。 */
export type ResolveLayerImage = (
  canvas: NonNullable<PsdLayerLike['canvas']>,
  layer: PsdLayerLike,
) => Promise<any>

export async function psdToFrame(
  psd: PsdLike,
  resolveImage: ResolveLayerImage,
  name?: string,
): Promise<any> {
  const children: any[] = []

  async function walk(layers: PsdLayerLike[] | undefined): Promise<void> {
    for (const layer of layers ?? []) {
      if (layer.hidden) {
        continue
      }
      if (layer.children?.length) {
        await walk(layer.children)
        continue
      }
      const canvas = layer.canvas
      const width = canvas?.width ?? ((layer.right ?? 0) - (layer.left ?? 0))
      const height = canvas?.height ?? ((layer.bottom ?? 0) - (layer.top ?? 0))
      if (!canvas || width <= 0 || height <= 0) {
        continue
      }
      const foreground = await resolveImage(canvas, layer)
      children.push({
        name: layer.name || 'Layer',
        foreground,
        style: {
          left: layer.left ?? 0,
          top: layer.top ?? 0,
          width,
          height,
          // ag-psd 的 opacity 为 0..1；缺省视为不透明。
          opacity: layer.opacity ?? 1,
        },
        meta: { inCanvasIs: 'Element2D' },
      })
    }
  }

  await walk(psd.children)

  return {
    name: name ?? psd.name ?? 'PSD',
    style: { left: 0, top: 0, width: psd.width, height: psd.height },
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame' },
    children,
  }
}
