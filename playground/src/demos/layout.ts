import type { Editor } from 'mce'

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

// 顶层「自动布局画板」（Frame + display:flex），刻意偏移到非 (0,0) 处：既测「往偏移画板里画/拖
// 元素」的坐标换算，又测偏移的 flex 画板本身不会被 yoga 根强制回 (0,0)——画板自身由 root 绝对定位、
// 其子由 flex 排布。往里拖元素应按主轴插入并保持偏移不跳位。
function offsetFrame(id: string, name: string, left: number, top: number, dir: 'row' | 'column'): any {
  const colors = ['#6366f1', '#06b6d4', '#22c55e']
  return {
    id,
    name,
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame', inPptIs: 'Slide' },
    style: {
      left,
      top,
      display: 'flex',
      flexDirection: dir,
      gap: 16,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: 'auto',
      height: 'auto',
      backgroundColor: '#eef2ff',
    },
    children: colors.map((color, i) => layoutChild(`${id}-c${i + 1}`, String(i + 1), color, 120, 80)),
  }
}

export async function loadLayoutDemo(editor: Editor): Promise<void> {
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
    // 两个偏移的顶层自动布局画板（非 (0,0)）：在里面画/拖元素，验证 flex 排布 + 落定坐标不跳位。
    offsetFrame('frame-a', '画板 A（row）', 120, 400, 'row'),
    offsetFrame('frame-b', '画板 B（column）', 720, 400, 'column'),
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 150)
}
