import type { Editor } from 'mce'

// 工作流（节点图）示例：卡片统一 2048×2048（与工具腰带「+」新增的节点一致），
// 图片/视频节点用同款 sparkle 占位图。还原「剧本 → 分镜脚本 → 分镜图 → 成片」的生成流。
// 节点靠 meta.inEditorIs=Workflow* 标记 + shape.connectionPoints 暴露左右端口。

const SIZE = 2048

// 工作流节点固定的左右端口：左=输入(idx 0)，右=输出(idx 1)。
const INPUT = { idx: 0, x: 0, y: 0.5, ang: Math.PI }
const OUTPUT = { idx: 1, x: 1, y: 0.5, ang: 0 }

interface NodeBase { id: string, name: string, left: number, top: number }

// 富文本段落：标题(粗体) + 若干正文行，统一用 @on-surface 语义色随主题自适应（标题靠 fontWeight 区分）。
// 空行用空格占位以保留行高。
function content(title: string, body: string[]): any[] {
  return [
    { fragments: [{ content: title, color: '@on-surface', fontWeight: 700 }] },
    ...body.map(line => ({ fragments: [{ content: line || ' ', color: '@on-surface' }] })),
  ]
}

// 与 @mce/workflow 一致的 sparkle（四角星）占位图：大 + 小两颗，方形 viewBox 随方形节点缩放。
function sparklePath(cx: number, cy: number, r: number): string {
  const k = r / 2
  return `M${cx} ${cy - r}`
    + `C${cx} ${cy - k} ${cx - k} ${cy} ${cx - r} ${cy}`
    + `C${cx - k} ${cy} ${cx} ${cy + k} ${cx} ${cy + r}`
    + `C${cx} ${cy + k} ${cx + k} ${cy} ${cx + r} ${cy}`
    + `C${cx + k} ${cy} ${cx} ${cy - k} ${cx} ${cy - r}Z`
}
// 透明底 + 中性灰图标：底色交给节点 @surface token 在画布层随主题绘制，图标明暗皆可辨。
function sparkleImage(): string {
  const icon = '#9ca3af'
  const op = 0.18
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">`
    + `<path d="${sparklePath(288, 236, 96)}" fill="${icon}" fill-opacity="${op}"/>`
    + `<path d="${sparklePath(196, 320, 46)}" fill="${icon}" fill-opacity="${op}"/>`
    + `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function textNode(o: NodeBase & { title: string, body: string[] }): any {
  return {
    id: o.id,
    name: o.name,
    style: {
      left: o.left,
      top: o.top,
      width: SIZE,
      height: SIZE,
      borderRadius: 32,
      borderColor: '@border-color',
      borderWidth: 2,
      backgroundColor: '@surface',
      padding: 150,
      fontSize: 88,
      lineHeight: 1.6,
    },
    text: { content: content(o.title, o.body) },
    shape: { connectionPoints: [INPUT, OUTPUT] },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: 'WorkflowText' },
  }
}

// 图片 / 视频节点：2k 方卡 + sparkle 占位（与点击新增的一致）。
function mediaNode(o: NodeBase, inEditorIs: 'WorkflowImage' | 'WorkflowVideo'): any {
  return {
    id: o.id,
    name: o.name,
    style: {
      left: o.left,
      top: o.top,
      width: SIZE,
      height: SIZE,
      borderRadius: 32,
      borderColor: '@border-color',
      borderWidth: 2,
      backgroundColor: '@surface',
    },
    foreground: { image: sparkleImage() },
    shape: { connectionPoints: [INPUT, OUTPUT] },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs },
  }
}

function connector(id: string, start: string, end: string): any {
  return {
    id,
    outline: {
      color: '#94a3b8',
      width: 20,
      lineCap: 'butt',
      lineJoin: 'round',
      headEnd: { type: 'bar', color: '#1e1e1e', width: 'sm' },
      tailEnd: { type: 'bar', color: '#1e1e1e', width: 'sm' },
    },
    connection: { start: { id: start, idx: OUTPUT.idx }, end: { id: end, idx: INPUT.idx }, mode: 'curved' },
    meta: { inCanvasIs: 'Element2D' },
  }
}

export function loadWorkflowDemo(editor: Editor): void {
  const GX = 2600 // 列间距
  const GY = 2500 // 行间距

  editor.setDoc([
    textNode({
      id: 'wf-script',
      name: '剧本',
      left: 0,
      top: GY,
      title: '🎬 剧本 ·《单词谐音梗-冰》',
      body: [
        '类型：少儿 / Q版 / 教育',
        '时长建议：10 秒',
        '基调：热血 × 盛唐史诗感 × 爽点节奏',
        '',
        '【序幕 · 现代 · 沙滩边】',
        '男孩(3岁) 与女孩(3岁) 坐在躺椅上一起吃刨冰。',
        '女孩：多亏这沙滩上有卖冰的',
        '男孩：是啊这大热天的，我爱死了',
        '女孩缓缓转头面向镜头：ice?',
      ],
    }),
    textNode({
      id: 'wf-shots',
      name: '分镜脚本',
      left: GX,
      top: GY,
      title: '📝 分镜脚本 · 脚本视图',
      body: [
        '镜 1 · 3s　序幕：两小孩沙滩吃冰，史诗级氛围',
        '镜 2 · 3s　第一幕：女孩沉沉感慨，男孩爆发热血',
        '镜 3 · 4s　高潮：女孩转头吐出谐音梗，ice!',
        '',
        '角色：男孩(3岁 Q版) / 女孩(3岁 Q版)',
        '画风：3D / 盛唐 / 暖色夕阳',
      ],
    }),
    mediaNode({ id: 'wf-img1', name: '分镜图 1', left: GX * 2, top: 0 }, 'WorkflowImage'),
    mediaNode({ id: 'wf-img2', name: '分镜图 2', left: GX * 2, top: GY }, 'WorkflowImage'),
    mediaNode({ id: 'wf-img3', name: '分镜图 3', left: GX * 2, top: GY * 2 }, 'WorkflowImage'),
    mediaNode({ id: 'wf-video', name: '成片', left: GX * 3, top: GY }, 'WorkflowVideo'),
    connector('wf-c1', 'wf-script', 'wf-shots'),
    connector('wf-c2', 'wf-shots', 'wf-img1'),
    connector('wf-c3', 'wf-shots', 'wf-img2'),
    connector('wf-c4', 'wf-shots', 'wf-img3'),
    connector('wf-c5', 'wf-img1', 'wf-video'),
    connector('wf-c6', 'wf-img2', 'wf-video'),
    connector('wf-c7', 'wf-img3', 'wf-video'),
  ] as any)

  // 切到工作流模式：Workflow.vue overlay 据此显示端口加号 / 拖拽建节点 / 节点标题等。
  editor.mode.value = 'workflow'
  setTimeout(() => editor.exec('zoomToFit'), 120)
}
