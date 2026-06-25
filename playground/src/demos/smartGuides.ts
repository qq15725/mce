import type { Editor } from 'mce'
import { box } from './shared'

// 智能参考线测试场景（对齐边/中线 + 等距分布，贴近 Figma，无固定档位卡点）：
// - 画板(Frame)内方块：拖动靠近画板边/中线测「画板边界吸附」，缩放测「resize 吸附」
// - 基准/上下/左右 三个兄弟方块：互相靠近测「对齐线 / 距离线（数值在线上方）」
// - 三个等距方块 + 自由方块：拖动「拖我」插入行内测「间距块 / 等距吸附」
// - 两个同尺寸方块靠近：可自由微调（不再被 4px 卡点网格粘住）
export function loadSmartGuidesDemo(editor: Editor): void {
  editor.setDoc([
    {
      id: 'sg-frame',
      name: '画板',
      style: { left: 0, top: 0, width: 420, height: 320, borderRadius: 12, backgroundColor: '#ffffff' },
      meta: { inPptIs: 'GroupShape', inEditorIs: 'Frame', inCanvasIs: 'Element2D' },
      children: [
        box({ id: 'sg-in', label: '画板内', color: '#3b82f6', left: 130, top: 120, width: 160, height: 80 }),
      ],
    },
    box({ id: 'sg-ref', label: '基准', color: '#ef4444', left: 560, top: 0, width: 180, height: 100 }),
    box({ id: 'sg-v', label: '上下', color: '#f59e0b', left: 560, top: 220, width: 180, height: 100 }),
    box({ id: 'sg-h', label: '左右', color: '#22c55e', left: 820, top: 0, width: 140, height: 100 }),
    box({ id: 'sg-s1', label: '1', color: '#8b5cf6', left: 560, top: 440, width: 120, height: 70 }),
    box({ id: 'sg-s2', label: '2', color: '#8b5cf6', left: 740, top: 440, width: 120, height: 70 }),
    box({ id: 'sg-s3', label: '3', color: '#8b5cf6', left: 920, top: 440, width: 120, height: 70 }),
    box({ id: 'sg-free', label: '拖我', color: '#ec4899', left: 740, top: 580, width: 120, height: 70 }),
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}
