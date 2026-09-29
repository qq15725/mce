import { describe, expect, it } from 'vitest'
import { nodeLabelEdge } from './nodeLabel'

function edge(angle: number) {
  return nodeLabelEdge({ left: 20, top: 40, width: 900, height: 383, rotation: angle * Math.PI / 180 })
}

describe('旋转标题', () => {
  it('未旋转时贴合左上角，半周后换到对边', () => {
    expect(edge(0)).toEqual({ left: 20, top: 40, width: 900, angle: 0 })
    expect(edge(180).left).toBeCloseTo(20)
    expect(edge(180).top).toBeCloseTo(40)
    expect(edge(180).angle).toBe(0)
  })

  it('超过直角才切换边，不在 45° 提前换到侧边', () => {
    for (const angle of [30, 46, 89, 90])
      expect(edge(angle).angle).toBeCloseTo(angle)
    for (const angle of [91, 96, 179, 181, 269, 270])
      expect(edge(angle).angle).toBeCloseTo(angle - 180)
    expect(edge(271).angle).toBeCloseTo(-89)
    expect(edge(-30).angle).toBeCloseTo(-30)
  })

  it('标题方向可读，所贴边的中点始终位于节点中心上方', () => {
    for (let angle = -360; angle <= 720; angle += 3) {
      const label = edge(angle)
      expect(Math.abs(label.angle)).toBeLessThanOrEqual(90)
      expect(label.width).toBe(900)
      const midpointY = label.top + Math.sin(label.angle * Math.PI / 180) * label.width / 2
      expect(midpointY).toBeLessThanOrEqual(40 + 383 / 2 + 1e-8)
    }
  })
})
