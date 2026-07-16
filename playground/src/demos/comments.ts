import type { Editor } from 'mce'

// 评论：几个色块 + 预置两条评论（一条画布锚、一条元素锚），并进入评论模式。
// 拖动「蓝色卡片」可见元素锚 pin 跟随；点画布空白处可继续新建评论。
export function loadCommentsDemo(editor: Editor): void {
  const cards = [
    { id: 'comment-card-1', color: '#4C6EF5', label: '蓝色卡片', x: 0, y: 0 },
    { id: 'comment-card-2', color: '#12B886', label: '绿色卡片', x: 320, y: 0 },
    { id: 'comment-card-3', color: '#F76707', label: '橙色卡片', x: 0, y: 220 },
  ]
  const nodes: any[] = []
  cards.forEach((c) => {
    nodes.push({
      id: c.id,
      style: { left: c.x, top: c.y, width: 260, height: 180 },
      fill: c.color,
      meta: { inCanvasIs: 'Element2D' },
    })
    nodes.push({
      id: `${c.id}-lbl`,
      style: { left: c.x, top: c.y + 78, width: 260, height: 24, fontSize: 16, color: '#fff', textAlign: 'center' },
      text: c.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)

  setTimeout(() => {
    editor.exec('zoomToFit')
    const comments: any = (editor as any).comments
    if (comments) {
      // 评论挂在元素上，offset 为相对该元素原点的局部坐标，拖动元素 / 其父级它都会跟随。
      const pin = (id: string, body: string, replies: string[] = []): void => {
        const node: any = editor.getNodeById(id)
        if (!node?.toLocal) {
          return
        }
        const ab = editor.getAabb(node)
        const local = node.toLocal({ x: ab.left + ab.width / 2, y: ab.top + ab.height / 2 })
        const tid = comments.addThread(node, { x: local.x, y: local.y }, body)
        replies.forEach(r => comments.reply(node, tid, r))
      }
      pin('comment-card-1', '这条钉在蓝色卡片上，拖动卡片它会跟随', ['回复试试，按 Esc 退出评论模式'])
      pin('comment-card-2', '绿色卡片也来一条')
      // 橙色卡片：长线程，回复够多撑破列表 max-height，用于测试评论面板滚动（滚轮 + 拖动滚动条）。
      pin(
        'comment-card-3',
        '橙色卡片：这是一条很长的评论线程，用来测试滚动。',
        Array.from({ length: 20 }, (_, i) => `第 ${i + 1} 条回复：滚动测试内容 ${'内容'.repeat((i % 4) + 1)}`),
      )
    }
    // 激活评论工具：点画布空白即可继续新建（按 C 也可切换）
    editor.activateTool('comment')
  }, 200)
}
