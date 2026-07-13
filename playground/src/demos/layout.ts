import type { Editor } from 'mce'
import { Flexbox } from 'modern-canvas'

function layoutChild(id: string, label: string, color: string, w: number, h: number): any {
  return {
    id,
    style: {
      width: w,
      height: h,
      borderRadius: 8,
      fontSize: 18,
      color: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: h,
    },
    fill: color,
    text: label,
    meta: { inCanvasIs: 'Element2D' },
  }
}

// 顶层画板（Frame），刻意偏移到非 (0,0) 处：用来测「往偏移画板里画/拖元素」时坐标换算是否正确
// （元素 style.left/top 相对画板原点，早前会漏减一个画板原点导致落定跳位）。
function offsetFrame(id: string, name: string, left: number, top: number, w: number, h: number): any {
  return {
    id,
    name,
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame', inPptIs: 'Slide' },
    style: {
      left,
      top,
      width: w,
      height: h,
      overflow: 'hidden',
      backgroundColor: '#eef2ff',
    },
    children: [
      // 画板内已有一个子块（相对画板原点定位），作为拖入 / 相对定位的参照。
      {
        id: `${id}-c1`,
        style: {
          left: 40,
          top: 40,
          width: 120,
          height: 80,
          borderRadius: 8,
          fontSize: 16,
          color: '#ffffff',
          textAlign: 'center',
          verticalAlign: 'middle',
          lineHeight: 80,
        },
        fill: '#6366f1',
        text: '内',
        meta: { inCanvasIs: 'Element2D' },
      },
    ],
  }
}

export async function loadLayoutDemo(editor: Editor): Promise<void> {
  // 编辑器声明支持 flex 布局，但底层 yoga 引擎需要按需加载。
  await Flexbox.load()
  // 顶层 flex 容器作为 yoga 根节点，其自身 left/top 会被强制为 (0,0)，
  // 因此把两个示例容器嵌套进一个外层 flex 容器，由父级布局排开它们。
  editor.setDoc([
    {
      id: 'flex-root',
      style: {
        display: 'flex',
        flexDirection: 'row',
        gap: 60,
        alignItems: 'flex-start',
        width: 'auto',
        height: 'auto',
      },
      meta: { inCanvasIs: 'Element2D' },
      children: [
        {
          id: 'flex-row',
          style: {
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'center',
            width: 'auto',
            height: 'auto',
            borderRadius: 16,
          },
          background: { color: '#0f172a' },
          meta: { inCanvasIs: 'Element2D' },
          children: [
            layoutChild('r1', '1', '#ef4444', 80, 80),
            layoutChild('r2', '2', '#f59e0b', 80, 120),
            layoutChild('r3', '3', '#22c55e', 80, 60),
            layoutChild('r4', '4', '#3b82f6', 80, 100),
          ],
        },
        {
          id: 'flex-col',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 20,
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            width: 'auto',
            height: 'auto',
            borderRadius: 16,
          },
          background: { color: '#1e293b' },
          meta: { inCanvasIs: 'Element2D' },
          children: [
            layoutChild('cc1', 'A', '#06b6d4', 160, 50),
            layoutChild('cc2', 'B', '#8b5cf6', 160, 50),
            layoutChild('cc3', 'C', '#ec4899', 160, 50),
          ],
        },
      ],
    },
    // 两个偏移的顶层画板（非 (0,0)）：在里面画/拖元素，验证落定坐标不跳位。
    offsetFrame('frame-a', '画板 A', 120, 360, 420, 300),
    offsetFrame('frame-b', '画板 B', 640, 360, 420, 300),
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 150)
}
