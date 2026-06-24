import type { Editor } from 'mce'

// 文字排版特性：字号 / 字重 / 斜体 / 颜色 / 对齐 / 字间距 / 行高 / 装饰线。
export function loadTextDemo(editor: Editor): void {
  const items: { text: string, style: Record<string, any> }[] = [
    { text: '大标题 Heading', style: { fontSize: 40, fontWeight: 700, color: '#0f172a' } },
    { text: '副标题 Subtitle', style: { fontSize: 26, fontWeight: 600, color: '#475569' } },
    { text: '斜体强调 italic emphasis', style: { fontSize: 20, fontStyle: 'italic', color: '#7c3aed' } },
    { text: '彩色 + 宽字距 letter spacing', style: { fontSize: 20, color: '#0ea5e9', letterSpacing: 4 } },
    { text: '右对齐文本 right aligned', style: { fontSize: 20, color: '#1a1a2e', textAlign: 'right' } },
    { text: '下划线 underline decoration', style: { fontSize: 20, color: '#16a34a', textDecoration: 'underline' } },
    { text: '删除线 line-through', style: { fontSize: 20, color: '#dc2626', textDecoration: 'line-through' } },
    { text: '两行文本演示\n行高 line-height 控制段间距', style: { fontSize: 18, color: '#334155', lineHeight: 1.8 } },
  ]
  let top = 0
  const nodes = items.map((it, i) => {
    const height = it.text.includes('\n') ? 80 : 56
    const node = {
      id: `text-${i}`,
      style: { left: 0, top, width: 560, height, ...it.style },
      text: it.text,
      meta: { inCanvasIs: 'Element2D' },
    }
    top += height + 12
    return node
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}
