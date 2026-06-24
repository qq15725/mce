import type { Editor } from 'mce'
import { box } from './shared'

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
