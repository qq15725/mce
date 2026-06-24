import type { Editor } from 'mce'
import { box, fitAndPlay } from './shared'

// 动画通过 Element2D 的 Animation 子节点（keyframes）驱动，时间轴播放时生效。
// playground 默认打开时间轴面板会把播放暂停，所以加载后主动 play。
export function loadAnimationDemo(editor: Editor): void {
  const animBox: any = box({ id: 'anim-box', label: '动画', color: '#4f8cff', left: 0, top: 80, width: 120, height: 120 })
  animBox.children = [
    {
      is: 'Animation',
      loop: true,
      duration: 2000,
      // 用 transform 写法（走 node 的 extraTransform，与 style.left/top 分通道、与拖拽不冲突）。
      keyframes: [
        { offset: 0, transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 },
        { offset: 0.5, transform: 'translate(360px, 0px) rotate(180deg)', opacity: 0.4 },
        { offset: 1, transform: 'translate(0px, 0px) rotate(360deg)', opacity: 1 },
      ],
    },
  ]
  editor.setDoc([
    {
      id: 'anim-track',
      style: { left: 0, top: 0, width: 480, height: 280, borderRadius: 16 },
      background: { color: '#0f172a' },
      meta: { inCanvasIs: 'Element2D' },
    },
    animBox,
  ] as any)
  fitAndPlay(editor, 100)
}
