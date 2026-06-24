import type { Editor } from 'mce'
import { box } from './shared'

// 用户提供的画板结构。
function frame(name: string, style: Record<string, any>): any {
  return {
    name,
    meta: {
      inCanvasIs: 'Element2D',
      inEditorIs: 'Frame',
      inPptIs: 'Slide',
    },
    style: {
      overflow: 'hidden',
      backgroundColor: '#dbeafe', // 浅蓝可见，便于看清画板裁剪边界
      width: 1200,
      height: 1200,
      left: 0,
      top: 0,
      ...style,
    },
  }
}

// 画板（Frame）示例：用「动态 addElement」搭建，测画板裁剪。
// - 画板经 addElement(genFrame, { active }) 动态加入（同宿主空文档自动补画板的写法）；
// - 子元素再经 addElement(box, { parent: frame }) 动态加入画板；
// - 每个画板内各有一个越过边界的溢出块（红/紫），验证 overflow:hidden 裁剪是否生效。
export function loadArtboardDemo(editor: Editor): void {
  editor.setDoc([])

  // 动态加画板 A（位于原点，active 选中），再往其中动态加子元素。
  const frameA = editor.addElement(frame('画板 A', { left: 0, top: 0, width: 600, height: 400 }), { active: true })
  editor.addElement(box({ id: 'ab-a1', label: 'A 内 1', color: '#3b82f6', left: 60, top: 60, width: 200, height: 100 }), { parent: frameA })
  editor.addElement(box({ id: 'ab-a2', label: 'A 内 2', color: '#22c55e', left: 320, top: 220, width: 200, height: 100 }), { parent: frameA })
  // 越过画板 A 右(600)/下(400)边界。
  editor.addElement(box({ id: 'ab-a-overflow', label: '溢出A', color: '#ef4444', left: 480, top: 300, width: 240, height: 240 }), { parent: frameA })

  // 嵌套画板：画板 B 内放一个内层画板，再放一个「在内层之外、且更晚渲染」的兄弟块。
  // 若 scissor pop 不恢复上层 rect，这个兄弟块会被错裁到内层画板范围 → 消失。
  const frameB = editor.addElement(frame('画板 B', { left: 760, top: 0, width: 600, height: 400 }))
  const inner = editor.addElement(frame('内层画板', { left: 40, top: 40, width: 200, height: 150 }), { parent: frameB })
  editor.addElement(box({ id: 'ab-inner', label: '内层内容', color: '#f59e0b', left: 20, top: 20, width: 160, height: 80 }), { parent: inner })
  // 兄弟块：在内层画板之外、但在画板 B 之内，且加在内层之后（渲染更晚）。裁剪正常它应可见。
  editor.addElement(box({ id: 'ab-b-sibling', label: '内层之外', color: '#8b5cf6', left: 320, top: 240, width: 220, height: 120 }), { parent: frameB })

  // 游离方块（拖入/拖出画板测 autoNest）。
  editor.addElement(box({ id: 'ab-loose', label: '拖我进画板', color: '#ec4899', left: 280, top: 520, width: 200, height: 100 }))

  setTimeout(() => editor.exec('zoomToFit'), 100)
}
