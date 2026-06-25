import type { Editor } from 'mce'

interface Pt { x: number, y: number }

// 把若干绝对坐标点收敛成元素 box（path bbox），并返回相对 box 原点的本地点。
function fit(points: Pt[]): { left: number, top: number, width: number, height: number, local: (p: Pt) => Pt } {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const width = Math.max(1, Math.max(...xs) - left)
  const height = Math.max(1, Math.max(...ys) - top)
  return { left, top, width, height, local: p => ({ x: p.x - left, y: p.y - top }) }
}

const f = (n: number): number => Math.round(n * 100) / 100

// 直线：单段 M L，选中后显示两端可拖端点。
function lineEl(id: string, a: Pt, b: Pt, color: string): any {
  const { left, top, width, height, local } = fit([a, b])
  const la = local(a)
  const lb = local(b)
  return {
    id,
    style: { left, top, width, height },
    shape: [{ data: `M ${f(la.x)} ${f(la.y)} L ${f(lb.x)} ${f(lb.y)}` }],
    outline: { color, width: 5, lineCap: 'round', lineJoin: 'round' },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D' },
  }
}

// 箭头：主干 M L + 箭头翼（M wing1 L b L wing2），与核心 getArrowPath 同构，
// 选中后显示端点；拖端点会按方向重算箭头翼。
function arrowEl(id: string, a: Pt, b: Pt, color: string, size = 14, angleDeg = 28): any {
  const theta = Math.atan2(b.y - a.y, b.x - a.x)
  const ang = (angleDeg * Math.PI) / 180
  const rot = (px: number, py: number, t: number): Pt => ({
    x: b.x + (px - b.x) * Math.cos(t) - (py - b.y) * Math.sin(t),
    y: b.y + (px - b.x) * Math.sin(t) + (py - b.y) * Math.cos(t),
  })
  const w1 = rot(b.x - size, b.y, theta + ang)
  const w2 = rot(b.x - size, b.y, theta - ang)
  const { left, top, width, height, local } = fit([a, b, w1, w2])
  const la = local(a)
  const lb = local(b)
  const lw1 = local(w1)
  const lw2 = local(w2)
  const data = `M ${f(la.x)} ${f(la.y)} L ${f(lb.x)} ${f(lb.y)} `
    + `M ${f(lw1.x)} ${f(lw1.y)} L ${f(lb.x)} ${f(lb.y)} L ${f(lw2.x)} ${f(lw2.y)}`
  return {
    id,
    style: { left, top, width, height },
    shape: [{ data }],
    outline: { color, width: 5, lineCap: 'round', lineJoin: 'round' },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D' },
  }
}

function label(id: string, text: string, left: number, top: number): any {
  return {
    id,
    style: { left, top, width: 220, height: 22, fontSize: 14, color: '#1a1a2e' },
    text,
    meta: { inCanvasIs: 'Element2D' },
  }
}

// 直线 / 箭头的端点式选择测试场景：
// - 选中任意直线/箭头：不再是矩形选框，而是沿线显示两端可拖端点；
// - 拖端点改变起止与角度；拖线身整体平移；
// - 箭头拖端点时箭头翼按新方向重算；
// - 框选/多选时线沿自身高亮（非矩形包围盒）。
export function loadLinesDemo(editor: Editor): void {
  editor.setDoc([
    label('ln-t1', '直线（选中拖两端端点）', 40, 20),
    lineEl('ln-1', { x: 40, y: 60 }, { x: 260, y: 60 }, '#3b82f6'), // 水平
    lineEl('ln-2', { x: 320, y: 60 }, { x: 320, y: 240 }, '#ef4444'), // 垂直
    lineEl('ln-3', { x: 400, y: 60 }, { x: 620, y: 240 }, '#22c55e'), // 斜
    lineEl('ln-4', { x: 700, y: 240 }, { x: 900, y: 60 }, '#06b6d4'), // 反斜

    label('ln-t2', '箭头（拖端点重算箭头）', 40, 320),
    arrowEl('ar-1', { x: 40, y: 380 }, { x: 280, y: 380 }, '#f59e0b'), // →
    arrowEl('ar-2', { x: 360, y: 560 }, { x: 360, y: 360 }, '#8b5cf6'), // ↑
    arrowEl('ar-3', { x: 440, y: 360 }, { x: 660, y: 540 }, '#ec4899'), // ↘
    arrowEl('ar-4', { x: 900, y: 360 }, { x: 700, y: 540 }, '#14b8a6'), // ↙
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}
