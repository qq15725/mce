import type { Editor } from 'mce'
import { box } from './shared'

// 画板内滚动示例：画板里元素多到超出边界时，鼠标悬在画板上滚轮 / 拖画板内滚动条
// 即可滚动画板内部内容显示下面的元素（画板本身裁剪住内容、不动位置）。
// 依赖 @mce/frameScroll 插件 + 引擎 Node2D.contentOffset。

function frame(name: string, style: Record<string, any>): any {
  return {
    name,
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame', inPptIs: 'Slide' },
    style: {
      overflow: 'auto', // 裁剪 + 悬停显示引擎渲染的滚动条
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      borderColor: '#e2e8f0',
      borderWidth: 2,
      ...style,
    },
  }
}

const CARD = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#6366f1', '#eab308', '#f97316', '#06b6d4', '#a855f7']

export function loadFrameScrollDemo(editor: Editor): void {
  editor.setDoc([])

  // 画板 A：纵向任务列表 —— 12 张卡片纵向排列，远超画板高度 → 竖向滚动。
  const listW = 460
  const padding = 24
  const cardH = 96
  const gap = 16
  const frameA = editor.addElement(
    frame('任务列表', { left: 0, top: 0, width: listW, height: 560 }),
    { active: true },
  )
  for (let i = 0; i < 12; i++) {
    editor.addElement(
      box({
        id: `fs-task-${i}`,
        label: `任务 ${i + 1}`,
        color: CARD[i % CARD.length],
        left: padding,
        top: padding + i * (cardH + gap),
        width: listW - padding * 2,
        height: cardH,
      }),
      { parent: frameA },
    )
  }

  // 画板 B：横向图库 —— 一排缩略图超出画板宽度 → 横向滚动（shift+滚轮 / 底部滚动条）。
  const galleryH = 260
  const thumb = 200
  const frameB = editor.addElement(
    frame('横向图库', { left: listW + 120, top: 0, width: 640, height: galleryH }),
    {},
  )
  for (let i = 0; i < 8; i++) {
    editor.addElement(
      box({
        id: `fs-thumb-${i}`,
        label: `图 ${i + 1}`,
        color: CARD[(i + 3) % CARD.length],
        left: padding + i * (thumb + gap),
        top: padding,
        width: thumb,
        height: galleryH - padding * 2,
      }),
      { parent: frameB },
    )
  }

  // 画板 C：双向溢出 —— 网格既超宽又超高，两条滚动条同时出现。
  const frameC = editor.addElement(
    frame('双向网格', { left: listW + 120, top: galleryH + 120, width: 500, height: 320 }),
    {},
  )
  const cell = 150
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      editor.addElement(
        box({
          id: `fs-cell-${r}-${c}`,
          label: `${r + 1}-${c + 1}`,
          color: CARD[(r * 5 + c) % CARD.length],
          left: padding + c * (cell + gap),
          top: padding + r * (cell + gap),
          width: cell,
          height: cell,
        }),
        { parent: frameC },
      )
    }
  }

  setTimeout(() => editor.exec('zoomToFit'), 100)
}
