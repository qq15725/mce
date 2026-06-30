import type { Editor } from 'mce'

// 工作流（节点图）示例：还原「剧本 → 分镜脚本 → 分镜图」的脚本生成流。
// 节点都是普通 Element2D，靠 meta.inEditorIs=Workflow* 标记 + shape.connectionPoints
// 暴露左右端口，连线用 connection.start/end({id,idx}) 自动路由（见 connection 示例）。

// 工作流节点固定的左右端口：左=输入(idx 0)，右=输出(idx 1)。
const INPUT = { idx: 0, x: 0, y: 0.5, ang: Math.PI }
const OUTPUT = { idx: 1, x: 1, y: 0.5, ang: 0 }

interface NodeBase { id: string, name: string, left: number, top: number, width: number, height: number }

// 富文本段落：标题(粗体深色) + 若干灰色正文行。空行用空格占位以保留行高。
function content(title: string, body: string[]): any[] {
  return [
    { fragments: [{ content: title, color: '#1f2937', fontWeight: 700 }] },
    ...body.map(line => ({ fragments: [{ content: line || ' ', color: '#6b7280' }] })),
  ]
}

function textNode(o: NodeBase & { title: string, body: string[] }): any {
  return {
    id: o.id,
    name: o.name,
    style: {
      left: o.left,
      top: o.top,
      width: o.width,
      height: o.height,
      borderRadius: 20,
      borderColor: '#ececf0',
      borderWidth: 1,
      backgroundColor: '#ffffff',
      padding: 28,
      fontSize: 14,
      lineHeight: 1.7,
    },
    text: { content: content(o.title, o.body) },
    shape: { connectionPoints: [INPUT, OUTPUT] },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: 'WorkflowText' },
  }
}

// 分镜图占位：渐变底 + 「AI 生成」角标 + 镜头标题，避免依赖网络图片。
function shotImage(label: string, hue: number, w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="hsl(${hue},68%,58%)"/>`
    + `<stop offset="1" stop-color="hsl(${(hue + 45) % 360},70%,38%)"/>`
    + `</linearGradient></defs>`
    + `<rect width="${w}" height="${h}" fill="url(#g)"/>`
    + `<circle cx="${w * 0.32}" cy="${h * 0.34}" r="${h * 0.09}" fill="#ffffff" fill-opacity="0.85"/>`
    + `<path d="M${w * 0.1} ${h * 0.78} L${w * 0.4} ${h * 0.46} L${w * 0.58} ${h * 0.64} L${w * 0.76} ${h * 0.42} L${w * 0.95} ${h * 0.78} Z" fill="#ffffff" fill-opacity="0.25"/>`
    + `<rect x="14" y="14" width="74" height="24" rx="12" fill="rgba(0,0,0,0.35)"/>`
    + `<text x="51" y="30" font-size="13" fill="#ffffff" text-anchor="middle" font-family="sans-serif">AI 生成</text>`
    + `<text x="${w / 2}" y="${h - 18}" font-size="16" fill="#ffffff" text-anchor="middle" font-family="sans-serif" font-weight="700">${label}</text>`
    + `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function imageNode(o: NodeBase & { label: string, hue: number }): any {
  return {
    id: o.id,
    name: o.name,
    style: {
      left: o.left,
      top: o.top,
      width: o.width,
      height: o.height,
      borderRadius: 20,
      borderColor: '#ececf0',
      borderWidth: 1,
    },
    foreground: { image: shotImage(o.label, o.hue, o.width, o.height) },
    shape: { connectionPoints: [INPUT, OUTPUT] },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: 'WorkflowImage' },
  }
}

function connector(id: string, start: string, end: string): any {
  return {
    id,
    style: { pointerEvents: 'none' },
    outline: { color: '#94a3b8', width: 2, lineCap: 'round', lineJoin: 'round' },
    connection: { start: { id: start, idx: OUTPUT.idx }, end: { id: end, idx: INPUT.idx }, mode: 'curved' },
    meta: { inCanvasIs: 'Element2D' },
  }
}

export function loadWorkflowDemo(editor: Editor): void {
  editor.setDoc([
    textNode({
      id: 'wf-script',
      name: '剧本',
      left: 0,
      top: 0,
      width: 380,
      height: 440,
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
      left: 560,
      top: 40,
      width: 400,
      height: 360,
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
    imageNode({ id: 'wf-img1', name: '分镜图 1', left: 1140, top: -20, width: 320, height: 240, label: '分镜图 1 · 序幕', hue: 28 }),
    imageNode({ id: 'wf-img2', name: '分镜图 2', left: 1140, top: 260, width: 320, height: 240, label: '分镜图 2 · 热血', hue: 210 }),
    imageNode({ id: 'wf-img3', name: '分镜图 3', left: 1140, top: 540, width: 320, height: 240, label: '分镜图 3 · 高潮', hue: 280 }),
    connector('wf-c1', 'wf-script', 'wf-shots'),
    connector('wf-c2', 'wf-shots', 'wf-img1'),
    connector('wf-c3', 'wf-shots', 'wf-img2'),
    connector('wf-c4', 'wf-shots', 'wf-img3'),
  ] as any)

  // 切到工作流模式：Workflow.vue overlay 据此显示端口加号 / 拖拽建节点等交互。
  editor.mode.value = 'workflow'
  setTimeout(() => editor.exec('zoomToFit'), 120)
}
