import type { Editor } from 'mce'
import type { Element2D } from 'modern-canvas'
import { INPUT_PORT, OUTPUT_PORT } from '@mce/workflow'

// 工作流（节点图）示例：**不写死任何节点数据**，全部走 @mce/workflow 的公开命令生成——
// 节点走 `addWorkflowNode`（尺寸 / 占位图 / 端口 / 主题色全部取内核模板默认值），
// 连线走 `addWorkflowConnection`（自带端点存在性、自环、重复、成环、端口方向校验）。
// 这里只提供「摆在哪、叫什么、写什么文案」，其余渲染细节留给内核，方便验证最新 API 的呈现。
// 还原「剧本 → 分镜脚本 → 分镜图 → 成片」的生成流。

const COL = 2600 // 列间距（节点默认 2048 宽 + 间隙）
const ROW = 2500 // 行间距

// 富文本段落：标题(粗体 @on-surface) + 正文(@on-surface-muted)，与内核占位文案同一套语义色，
// 随主题自适应。空行用空格占位以保留行高。
function writeText(node: Element2D, title: string, body: string[]): void {
  node.text = {
    content: [
      { fragments: [{ content: title, color: '@on-surface', fontWeight: 700 }] },
      ...body.map(line => ({ fragments: [{ content: line || ' ', color: '@on-surface-muted' }] })),
    ],
  } as any
}

// 收尾 fit 前要等相机停下：addWorkflowNode 每加一个节点都会把它带入视口（500ms 缓动），
// 且走 URL 参数（?demo=workflow）时画板 DOM 还没量到尺寸。此刻 zoomToFit 的结果不是被后续
// 入场动画覆盖，就是按 0 尺寸画板算出最小缩放——两种都表现为画面一片空白。
// 等「画板有尺寸 + 相机连续两帧不动」再 fit。
async function waitForCameraIdle(editor: Editor): Promise<void> {
  let last = ''
  for (let i = 0; i < 180; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
    const { position, zoom } = editor.camera.value
    const now = `${position.x},${position.y},${zoom.x}`
    if (now === last && editor.drawboardAabb.value.width > 0) {
      return
    }
    last = now
  }
}

export async function loadWorkflowDemo(editor: Editor): Promise<void> {
  const { exec, setDoc, waitUntilFontLoad } = editor

  setDoc([])
  // 切到工作流模式：Workflow.vue overlay 据此显示端口加号 / 拖拽建节点 / 节点标题等。
  editor.mode.value = 'workflow'

  function addNode(type: 'text' | 'image' | 'video', x: number, y: number, name: string): Element2D {
    const node = exec('addWorkflowNode', type, { x, y }) as Element2D
    node.name = name
    return node
  }

  function connect(start: Element2D, end: Element2D): void {
    exec('addWorkflowConnection', start.id, OUTPUT_PORT.idx, end.id, INPUT_PORT.idx)
  }

  const script = addNode('text', 0, ROW, '剧本')
  writeText(script, '🎬 剧本 ·《单词谐音梗-冰》', [
    '类型：少儿 / Q版 / 教育',
    '时长建议：10 秒',
    '基调：热血 × 盛唐史诗感 × 爽点节奏',
    '',
    '【序幕 · 现代 · 沙滩边】',
    '男孩(3岁) 与女孩(3岁) 坐在躺椅上一起吃刨冰。',
    '女孩：多亏这沙滩上有卖冰的',
    '男孩：是啊这大热天的，我爱死了',
    '女孩缓缓转头面向镜头：ice?',
  ])

  const shots = addNode('text', COL, ROW, '分镜脚本')
  writeText(shots, '📝 分镜脚本 · 脚本视图', [
    '镜 1 · 3s　序幕：两小孩沙滩吃冰，史诗级氛围',
    '镜 2 · 3s　第一幕：女孩沉沉感慨，男孩爆发热血',
    '镜 3 · 4s　高潮：女孩转头吐出谐音梗，ice!',
    '',
    '角色：男孩(3岁 Q版) / 女孩(3岁 Q版)',
    '画风：3D / 盛唐 / 暖色夕阳',
  ])

  const images = [0, 1, 2].map(i => addNode('image', COL * 2, ROW * i, `分镜图 ${i + 1}`))
  const video = addNode('video', COL * 3, ROW, '成片')

  connect(script, shots)
  for (const image of images) {
    connect(shots, image)
    connect(image, video)
  }

  // 文字节点按内容自适应高度。内核在 addWorkflowNode 里对**占位文案**已 fit 过一次，
  // 这里换了文案要等字体就绪后重新 fit，否则高度停在占位文案的行数上。
  await waitUntilFontLoad()
  exec('textToFit', script)
  exec('textToFit', shots)

  exec('selectNone')
  await waitForCameraIdle(editor)
  exec('zoomToFit')
  // 展示「生成中」流动 shimmer：把「分镜图 1」标记为生成中（宿主异步生成时按此开/关）。
  exec('setWorkflowGenerating', images[0].id, true)
}
