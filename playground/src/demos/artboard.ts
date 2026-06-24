import type { Editor } from 'mce'
import { box } from './shared'

// 画板（Frame）示例：测试画板逻辑。
// - 两个画板（meta.inEditorIs='Frame'）各含子元素，验证画板识别与子元素「画板相对坐标」；
// - 游离方块「拖我进画板」可拖入/拖出画板，验证 autoNest 自动嵌套与坐标换算；
// - 也可把画板 A 的方块拖到画板 B，测跨画板迁移。
export function loadArtboardDemo(editor: Editor): void {
  // 用户提供的画板结构。
  const frame = (name: string, style: Record<string, any>, children: any[] = []): any => ({
    name,
    meta: {
      inCanvasIs: 'Element2D',
      inEditorIs: 'Frame',
      inPptIs: 'Slide',
    },
    style: {
      overflow: 'hidden',
      backgroundColor: '#fff',
      width: 1200,
      height: 1200,
      left: 0,
      top: 0,
      ...style,
    },
    children,
  })

  editor.setDoc([
    frame('画板 A', { left: 0, top: 0, width: 600, height: 400 }, [
      box({ id: 'ab-a1', label: 'A 内 1', color: '#3b82f6', left: 60, top: 60, width: 200, height: 100 }),
      box({ id: 'ab-a2', label: 'A 内 2', color: '#22c55e', left: 320, top: 220, width: 200, height: 100 }),
    ]),
    frame('画板 B', { left: 760, top: 0, width: 600, height: 400 }, [
      box({ id: 'ab-b1', label: 'B 内', color: '#f59e0b', left: 200, top: 150, width: 200, height: 100 }),
    ]),
    box({ id: 'ab-loose', label: '拖我进画板', color: '#ec4899', left: 280, top: 520, width: 200, height: 100 }),
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}
