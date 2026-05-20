import type { Editor } from 'mce'
import { Flexbox } from 'modern-canvas'

let connectionRaf: number | undefined

function stopConnectionLoop(): void {
  if (connectionRaf !== undefined) {
    cancelAnimationFrame(connectionRaf)
    connectionRaf = undefined
  }
}

// 通过 URL 参数加载时，时间轴插件的 immediate watcher 会在挂载后把 paused 重置为
// 面板可见状态，所以延迟到挂载之后再 play，按钮点击场景也兼容。
function fitAndPlay(editor: Editor, delay: number): void {
  setTimeout(() => {
    editor.exec('zoomToFit')
    editor.exec('play')
  }, delay)
}

interface BoxOptions {
  id: string
  label: string
  color: string
  left: number
  top: number
  width?: number
  height?: number
}

function box(o: BoxOptions): any {
  const width = o.width ?? 140
  const height = o.height ?? 80
  return {
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
}

function connector(id: string, startId: string, endId: string, color: string): any {
  return {
    id,
    style: { pointerEvents: 'none' },
    outline: { color, width: 3, lineCap: 'round', lineJoin: 'round' },
    connection: { start: { id: startId }, end: { id: endId } },
    meta: { inCanvasIs: 'Element2D' },
  }
}

// 连接器元素只会自动定位/缩放到两个锚点之间的包围盒，并不会自己画线。
// 这里按真实锚点位置每帧重算连线 path，让连线在拖动元素时实时跟随。
function startConnectionLoop(editor: Editor, ids: string[]): void {
  const update = (): void => {
    const root: any = editor.root.value
    for (const id of ids) {
      const conn: any = root.findOne((n: any) => n.id === id)
      if (!conn?.connection?.isValid())
        continue
      const s = conn.connection.resolveAnchor(conn.connection.start)
      const e = conn.connection.resolveAnchor(conn.connection.end)
      if (!s || !e)
        continue
      const minX = Math.min(s.x, e.x)
      const minY = Math.min(s.y, e.y)
      conn.shape.paths = [
        { data: `M ${s.x - minX} ${s.y - minY} L ${e.x - minX} ${e.y - minY}` },
      ]
    }
    connectionRaf = requestAnimationFrame(update)
  }
  connectionRaf = requestAnimationFrame(update)
}

export function loadConnectionDemo(editor: Editor): void {
  stopConnectionLoop()
  editor.setDoc([
    box({ id: 'c-a', label: '开始', color: '#4f8cff', left: 0, top: 0 }),
    box({ id: 'c-b', label: '处理', color: '#22c55e', left: 380, top: 140 }),
    box({ id: 'c-c', label: '结束', color: '#a855f7', left: 120, top: 340 }),
    connector('c-ab', 'c-a', 'c-b', '#f43f5e'),
    connector('c-bc', 'c-b', 'c-c', '#f59e0b'),
  ])
  startConnectionLoop(editor, ['c-ab', 'c-bc'])
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
  stopConnectionLoop()
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
  stopConnectionLoop()
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
  stopConnectionLoop()
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

export async function loadVideoDemo(editor: Editor): Promise<void> {
  stopConnectionLoop()
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
