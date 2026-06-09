import type { Editor } from 'mce'
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
