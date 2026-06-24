import type { Editor } from 'mce'
import { box } from './shared'

// 交互触发器示例：交互存于元素 meta.interactions（随文档加载）。预览模式下：
// 点蓝块播放、悬停绿块播放/暂停、点紫块打开链接。每个块自带 spin 循环动画。
function spinBox(id: string, label: string, color: string, left: number, interactions: any[]): any {
  const el = box({ id, label, color, left, top: 120, width: 120, height: 120 })
  el.children = [
    { is: 'Animation', loop: true, duration: 1500, keyframes: [{ offset: 0, rotate: 0 }, { offset: 1, rotate: 360 }] },
  ]
  el.meta = { inCanvasIs: 'Element2D', interactions }
  return el
}

export function loadInteractionDemo(editor: Editor): void {
  editor.setDoc([
    {
      id: 'itx-board',
      style: { left: 0, top: 0, width: 600, height: 360, borderRadius: 16 },
      background: { color: '#0f172a' },
      meta: { inCanvasIs: 'Element2D' },
    },
    {
      id: 'itx-title',
      style: { left: 0, top: -52, width: 600, height: 40, fontSize: 15, color: '#475569', textAlign: 'center', verticalAlign: 'middle', lineHeight: 40 },
      text: '点交互面板的 ▶预览 后试试：点蓝块播放 · 悬停绿块播放/暂停 · 点紫块打开链接',
      meta: { inCanvasIs: 'Element2D' },
    },
    spinBox('itx-blue', '点我播放', '#4f8cff', 60, [
      { id: 'b1', trigger: 'click', action: 'play' },
    ]),
    spinBox('itx-green', '悬停', '#22c55e', 240, [
      { id: 'g1', trigger: 'pointerEnter', action: 'play' },
      { id: 'g2', trigger: 'pointerLeave', action: 'pause' },
    ]),
    spinBox('itx-purple', '打开链接', '#a855f7', 420, [
      { id: 'p1', trigger: 'click', action: 'openUrl', url: 'https://github.com/qq15725/mce' },
    ]),
  ] as any)
  setTimeout(() => {
    editor.exec('zoomToFit')
    editor.exec('pause')
    editor.exec('seekStart')
    if (!editor.exec('isPanelVisible', 'interactions'))
      editor.exec('togglePanel', 'interactions')
  }, 150)
}
