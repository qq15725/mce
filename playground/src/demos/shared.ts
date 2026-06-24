import type { Editor } from 'mce'

// 通过 URL 参数加载时，时间轴插件的 immediate watcher 会在挂载后把 paused 重置为
// 面板可见状态，所以延迟到挂载之后再 play，按钮点击场景也兼容。
export function fitAndPlay(editor: Editor, delay: number): void {
  setTimeout(() => {
    editor.exec('zoomToFit')
    editor.exec('play')
  }, delay)
}

export interface ConnectionPoint { idx: number, x: number, y: number, ang?: number }
export interface BoxOptions {
  id: string
  label: string
  color: string
  left: number
  top: number
  width?: number
  height?: number
  points?: ConnectionPoint[]
}

export function box(o: BoxOptions): any {
  const width = o.width ?? 140
  const height = o.height ?? 80
  const el: any = {
    id: o.id,
    style: {
      left: o.left,
      top: o.top,
      width,
      height,
      borderRadius: 10,
      fontSize: 16,
      color: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: height,
    },
    fill: o.color,
    text: o.label,
    meta: { inCanvasIs: 'Element2D' },
  }
  if (o.points) {
    el.shape = { connectionPoints: o.points }
  }
  return el
}
