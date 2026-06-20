import type { Editor } from 'mce'
import { createChartElement, createTableElement } from 'mce'
import { Flexbox } from 'modern-canvas'

// 通过 URL 参数加载时，时间轴插件的 immediate watcher 会在挂载后把 paused 重置为
// 面板可见状态，所以延迟到挂载之后再 play，按钮点击场景也兼容。
function fitAndPlay(editor: Editor, delay: number): void {
  setTimeout(() => {
    editor.exec('zoomToFit')
    editor.exec('play')
  }, delay)
}

interface ConnectionPoint { idx: number, x: number, y: number, ang?: number }
interface BoxOptions {
  id: string
  label: string
  color: string
  left: number
  top: number
  width?: number
  height?: number
  points?: ConnectionPoint[]
}

function box(o: BoxOptions): any {
  const width = o.width ?? 140
  const height = o.height ?? 80
  const el: any = {
    id: o.id,
    style: {
      left: o.left,
      top: o.top,
      width,
      height,
      borderRadius: 10,
      fontSize: 16,
      color: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: height,
    },
    fill: o.color,
    text: o.label,
    meta: { inCanvasIs: 'Element2D' },
  }
  if (o.points) {
    el.shape = { connectionPoints: o.points }
  }
  return el
}

// Edge connection points (x/y normalized 0..1, ang = exit direction in radians;
// canvas y is down so π/2 = down, -π/2 = up).
const RIGHT = { idx: 0, x: 1, y: 0.5, ang: 0 }
const LEFT = { idx: 1, x: 0, y: 0.5, ang: Math.PI }
const BOTTOM = { idx: 2, x: 0.5, y: 1, ang: Math.PI / 2 }
const TOP = { idx: 3, x: 0.5, y: 0, ang: -Math.PI / 2 }

// modern-canvas 现在内建连线路由：设置 connection.start/end(+idx) + mode，连接器会
// 自动定位、按方向路由并绘制线条（派生路径，不写 shape.paths），拖动元素时实时跟随。
type ConnectionMode = 'straight' | 'curved' | 'orthogonal'
function connector(id: string, start: [string, number], end: [string, number], color: string, mode: ConnectionMode): any {
  return {
    id,
    style: { pointerEvents: 'none' },
    outline: { color, width: 3, lineCap: 'round', lineJoin: 'round' },
    connection: { start: { id: start[0], idx: start[1] }, end: { id: end[0], idx: end[1] }, mode },
    meta: { inCanvasIs: 'Element2D' },
  }
}

export function loadConnectionDemo(editor: Editor): void {
  editor.setDoc([
    box({ id: 'c-a', label: '开始', color: '#4f8cff', left: 0, top: 60, points: [RIGHT, BOTTOM] }),
    box({ id: 'c-b', label: '处理', color: '#22c55e', left: 460, top: 0, points: [LEFT, BOTTOM] }),
    box({ id: 'c-c', label: '结束', color: '#a855f7', left: 320, top: 340, points: [TOP, LEFT] }),
    connector('c-ab', ['c-a', RIGHT.idx], ['c-b', LEFT.idx], '#f43f5e', 'orthogonal'),
    connector('c-bc', ['c-b', BOTTOM.idx], ['c-c', TOP.idx], '#f59e0b', 'curved'),
    connector('c-ac', ['c-a', BOTTOM.idx], ['c-c', LEFT.idx], '#06b6d4', 'straight'),
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

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

export async function loadLayoutDemo(editor: Editor): Promise<void> {
  // 编辑器声明支持 flex 布局，但底层 yoga 引擎需要按需加载。
  await Flexbox.load()
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
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 150)
}

// 动画通过 Element2D 的 Animation 子节点（keyframes）驱动，时间轴播放时生效。
// playground 默认打开时间轴面板会把播放暂停，所以加载后主动 play。
export function loadAnimationDemo(editor: Editor): void {
  const animBox: any = box({ id: 'anim-box', label: '动画', color: '#4f8cff', left: 0, top: 80, width: 120, height: 120 })
  animBox.children = [
    {
      is: 'Animation',
      loop: true,
      duration: 2000,
      keyframes: [
        { offset: 0, left: 0, top: 80, rotate: 0, opacity: 1 },
        { offset: 0.5, left: 360, top: 80, rotate: 180, opacity: 0.4 },
        { offset: 1, left: 0, top: 80, rotate: 360, opacity: 1 },
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

// 交互触发器示例：交互存于元素 meta.interactions（随文档加载）。预览模式下：
// 点蓝块播放、悬停绿块播放/暂停、点紫块打开链接。每个块自带 spin 循环动画。
function spinBox(id: string, label: string, color: string, left: number, interactions: any[]): any {
  const el = box({ id, label, color, left, top: 120, width: 120, height: 120 })
  el.children = [
    { is: 'Animation', loop: true, duration: 1500, keyframes: [{ offset: 0, rotate: 0 }, { offset: 1, rotate: 360 }] },
  ]
  el.meta = { inCanvasIs: 'Element2D', interactions }
  return el
}

export function loadInteractionDemo(editor: Editor): void {
  editor.setDoc([
    {
      id: 'itx-board',
      style: { left: 0, top: 0, width: 600, height: 360, borderRadius: 16 },
      background: { color: '#0f172a' },
      meta: { inCanvasIs: 'Element2D' },
    },
    {
      id: 'itx-title',
      style: { left: 0, top: -52, width: 600, height: 40, fontSize: 15, color: '#475569', textAlign: 'center', verticalAlign: 'middle', lineHeight: 40 },
      text: '点交互面板的 ▶预览 后试试：点蓝块播放 · 悬停绿块播放/暂停 · 点紫块打开链接',
      meta: { inCanvasIs: 'Element2D' },
    },
    spinBox('itx-blue', '点我播放', '#4f8cff', 60, [
      { id: 'b1', trigger: 'click', action: 'play' },
    ]),
    spinBox('itx-green', '悬停', '#22c55e', 240, [
      { id: 'g1', trigger: 'pointerEnter', action: 'play' },
      { id: 'g2', trigger: 'pointerLeave', action: 'pause' },
    ]),
    spinBox('itx-purple', '打开链接', '#a855f7', 420, [
      { id: 'p1', trigger: 'click', action: 'openUrl', url: 'https://github.com/qq15725/mce' },
    ]),
  ] as any)
  setTimeout(() => {
    editor.exec('zoomToFit')
    editor.exec('pause')
    editor.exec('seekStart')
    if (!editor.exec('isPanelVisible', 'interactions'))
      editor.exec('togglePanel', 'interactions')
  }, 150)
}

export function loadGifDemo(editor: Editor): void {
  editor.setDoc([
    {
      id: 'gif-demo',
      style: { left: 0, top: 0, width: 300, height: 300 },
      foreground: { image: '/example.gif' },
      meta: { inCanvasIs: 'Element2D', inPptIs: 'Picture' },
    },
  ] as any)
  fitAndPlay(editor, 200)
}

// 智能参考线测试场景：
// - 画板(Frame)内方块：拖动靠近画板边/中线测「画板边界吸附」，缩放测「resize 吸附」
// - 基准/上下/左右 三个兄弟方块：互相靠近测「对齐线 / 距离线 / 4·8·12·16 间距卡点」
// - 三个等距方块 + 自由方块：拖动「拖我」插入行内测「间距块 / 间距线」
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

// 图片样式（foreground.effects）示例：对照 modern-canvas 官方 playground 的烘焙用例。
// 关键点（见 bakeImageEffects）：
// - effects 基于图片 alpha 轮廓（source-in），需用带透明的图（example.png 线稿），矩形图看不出效果；
// - 烘焙不会自动叠原图，空 `{}` 层才等于「画一次原图」；
// - 带 translate 的层 source-over 画在上面，不带 translate 的层 destination-over 落到背后。
export function loadImageEffectsDemo(editor: Editor): void {
  const cases: { label: string, effects?: any[] }[] = [
    { label: '无 effects' },
    { label: '描边 outline', effects: [{ outline: { width: 8, color: '#ff3366' } }] },
    { label: '填充 fill', effects: [{ fill: { color: '#22ccaa' } }] },
    { label: '渐变填充', effects: [{ fill: { linearGradient: { angle: 45, stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#f59e0b' }] } } }] },
    { label: '投影 shadow', effects: [{ shadow: { color: '#000000aa', blur: 16, offsetX: 8, offsetY: 8 } }] },
    // 重影：填充层位移画在上，空层把原图铺在其后
    { label: '位移重影', effects: [{ fill: { color: '#ff8800' }, transform: 'translate(16, 16)' }, {}] },
    // 同心双描边：细白边在上，粗青边 destination-over 落到其后
    { label: '双重描边', effects: [{ outline: { width: 6, color: '#ffffff' } }, { outline: { width: 16, color: '#0ea5e9' } }] },
    { label: '描边+投影', effects: [{ outline: { width: 6, color: '#facc15' } }, { shadow: { color: '#00000099', blur: 14, offsetX: 6, offsetY: 6 } }] },
  ]
  const COLS = 4
  const CELL_W = 220
  const CELL_H = 230
  const TILE = 170
  const nodes: any[] = []
  cases.forEach((c, i) => {
    const x = (i % COLS) * CELL_W
    const y = Math.floor(i / COLS) * CELL_H
    nodes.push({
      id: `ie-${i}`,
      style: { left: x, top: y, width: TILE, height: TILE, backgroundColor: '#ffffff' },
      foreground: { image: '/example.png', fillWithShape: true, ...(c.effects ? { effects: c.effects } : {}) },
      meta: { inCanvasIs: 'Element2D', inPptIs: 'Picture' },
    })
    nodes.push({
      id: `ie-lbl-${i}`,
      style: { left: x, top: y + TILE + 6, width: TILE, height: 24, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: c.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

// 各种几何形状：shape.paths 的 path data 会被缩放铺满元素 box（坐标只需相对正确）。
const SHAPES: { label: string, data: string, color: string }[] = [
  { label: '矩形', data: 'M0 0H24V24H0Z', color: '#ef4444' },
  { label: '圆形', data: 'M12 0A12 12 0 1 1 12 24A12 12 0 1 1 12 0Z', color: '#f59e0b' },
  { label: '三角', data: 'M12 0L24 24H0Z', color: '#22c55e' },
  { label: '菱形', data: 'M12 0L24 12L12 24L0 12Z', color: '#06b6d4' },
  { label: '五边形', data: 'M12 0L24 9L19.5 24H4.5L0 9Z', color: '#3b82f6' },
  { label: '六边形', data: 'M6 0H18L24 12L18 24H6L0 12Z', color: '#8b5cf6' },
  { label: '五角星', data: 'M12 0L15 8.5H24L16.5 14L19.5 24L12 18L4.5 24L7.5 14L0 8.5H9Z', color: '#ec4899' },
  { label: '箭头', data: 'M0 8H16V0L24 12L16 24V16H0Z', color: '#14b8a6' },
]

export function loadShapesDemo(editor: Editor): void {
  const COLS = 4
  const CELL = 180
  const SIZE = 130
  const nodes: any[] = []
  SHAPES.forEach((s, i) => {
    const x = (i % COLS) * CELL
    const y = Math.floor(i / COLS) * CELL
    nodes.push({
      id: `shape-${i}`,
      style: { left: x, top: y, width: SIZE, height: SIZE },
      shape: [{ data: s.data }],
      fill: s.color,
      outline: { color: '#0f172a', width: 2 },
      meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D' },
    })
    nodes.push({
      id: `shape-lbl-${i}`,
      style: { left: x, top: y + SIZE + 4, width: SIZE, height: 22, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: s.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

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

// 填充 / 描边 / 阴影 / 透明度：纯色、线性渐变、径向渐变、图片填充、虚线描边、外阴影等。
export function loadFillStrokeDemo(editor: Editor): void {
  const cards: { label: string, props: any }[] = [
    { label: '纯色填充', props: { fill: '#3b82f6' } },
    { label: '线性渐变', props: { fill: { linearGradient: { angle: 45, stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#ec4899' }] } } } },
    { label: '径向渐变', props: { fill: { radialGradient: { stops: [{ offset: 0, color: '#fde047' }, { offset: 1, color: '#ea580c' }] } } } },
    { label: '图片填充', props: { fill: { image: '/example.jpg' } } },
    { label: '虚线描边', props: { fill: '#ffffff', outline: { color: '#0ea5e9', width: 3, style: 'dashed' } } },
    { label: '粗描边+阴影', props: { fill: '#22c55e', outline: { color: '#064e3b', width: 5 }, shadow: { color: '#00000066', blur: 18, offsetX: 8, offsetY: 10 } } },
    { label: '外阴影', props: { fill: '#f59e0b', shadow: { color: '#00000055', blur: 24, offsetX: 0, offsetY: 12 } } },
    { label: '半透明', props: { fill: '#ef4444', style: { opacity: 0.45 } } },
  ]
  const COLS = 4
  const CELL_W = 220
  const CELL_H = 200
  const TILE = 170
  const nodes: any[] = []
  cards.forEach((c, i) => {
    const x = (i % COLS) * CELL_W
    const y = Math.floor(i / COLS) * CELL_H
    const { style: extraStyle, ...rest } = c.props
    nodes.push({
      id: `fs-${i}`,
      style: { left: x, top: y, width: TILE, height: TILE - 30, borderRadius: 16, ...extraStyle },
      ...rest,
      meta: { inCanvasIs: 'Element2D' },
    })
    nodes.push({
      id: `fs-lbl-${i}`,
      style: { left: x, top: y + TILE - 24, width: TILE, height: 22, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: c.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

// 表格：复用 mce 内建 table 元素（首行表头）。
export function loadTableDemo(editor: Editor): void {
  const table: any = createTableElement(4, 4, { width: 480, height: 240 })
  table.id = 'table-demo'
  table.style = { ...table.style, left: 0, top: 0 }
  editor.setDoc([table] as any)
  setTimeout(() => editor.exec('zoomToFit'), 120)
}

// 图表：复用 mce 内建 chart 元素（柱状 / 折线 / 饼图 / 条形）。需要可选依赖 echarts。
export function loadChartDemo(editor: Editor): void {
  const specs: { type: any, x: number, y: number, opts?: any }[] = [
    { type: 'column', x: 0, y: 0 },
    { type: 'line', x: 420, y: 0 },
    { type: 'pie', x: 0, y: 300, opts: { categories: ['A', 'B', 'C', 'D'], series: [{ name: '占比', values: [35, 25, 22, 18] }] } },
    { type: 'bar', x: 420, y: 300 },
  ]
  const nodes = specs.map((s, i) => {
    const el: any = createChartElement(s.type, { width: 380, height: 260, ...s.opts })
    el.id = `chart-${i}`
    el.style = { ...el.style, left: s.x, top: s.y }
    return el
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 150)
}

export async function loadVideoDemo(editor: Editor): Promise<void> {
  editor.setDoc([
    {
      is: 'Video2D',
      id: 'video-demo',
      src: '/example.mp4',
      style: { left: 0, top: 0, width: 480, height: 270 },
      meta: { inCanvasIs: 'Video2D' },
    },
  ] as any)
  // 视频纹理异步加载，加载完成前 getTimeRange 取不到时长，endTime 会是 0，
  // 导致播放 RAF 不推进时间，所以等视频就绪后再重算时间轴长度。
  const video: any = editor.root.value.findOne((n: any) => n.id === 'video-demo')
  await video?.waitLoad?.()
  await editor.recomputeTimelineEndTime()
  fitAndPlay(editor, 100)
}
