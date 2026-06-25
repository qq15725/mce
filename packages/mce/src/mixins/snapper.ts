import type { Vector2Like } from 'modern-path2d'
import type { Reactive } from 'vue'
import { computed, reactive } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface SnapperData {
      xLines?: number[]
      yLines?: number[]
      points?: Vector2Like[]
    }

    interface Snapper {
      getLines: () => SnapperData
    }

    interface Editor {
      snappers: Reactive<Map<string, Snapper>>
      registerSnapper: (key: string, snapper: Snapper) => void
      unregisterSnapper: (key: string) => void
      snap: (
        box: {
          left: number
          top: number
          width: number
          height: number
        },
      ) => void
      /** 缩放吸附：按被拖动的边（dir 含 t/l/r/b）将该边对齐到最近的吸附线，调整对应宽高。 */
      snapResize: (
        box: {
          left: number
          top: number
          width: number
          height: number
        },
        dir: string,
      ) => void
    }
  }
}

// 模块级导出，方便单测：在 threshold 内找离 position 最近的吸附线，超出阈值或无线时返回 undefined。
export function closestLine(
  lines: Iterable<number>,
  position: number,
  threshold: number,
): number | undefined {
  let closest: number | undefined
  let minDist = Infinity
  for (const num of lines) {
    const absDist = Math.abs(num - position)
    if (absDist < minDist) {
      minDist = absDist
      closest = num
    }
  }
  return minDist < threshold ? closest : undefined
}

export default defineMixin((editor) => {
  const {
    camera,
  } = editor

  const snappers = reactive(new Map<string, Mce.Snapper>())
  const snapThreshold = computed(() => Math.max(1, 5 / camera.value.zoom.x))

  const registerSnapper: Mce.Editor['registerSnapper'] = (key, snapper) => {
    snappers.set(key, snapper)
  }

  const unregisterSnapper: Mce.Editor['unregisterSnapper'] = (key) => {
    snappers.delete(key)
  }

  // 汇总所有 snapper 提供的吸附线（对齐线/等距分布线）。
  function getSnapAxes(): { axisX: Set<number>, axisY: Set<number> } {
    const axisX = new Set<number>()
    const axisY = new Set<number>()
    snappers.forEach((snapper) => {
      const { xLines, yLines } = snapper.getLines()
      xLines?.forEach(v => axisX.add(v))
      yLines?.forEach(v => axisY.add(v))
    })
    return { axisX, axisY }
  }

  // 盒子在某轴上参与吸附的位置：x→left/center/right，y→top/center/bottom。
  function axisOffsets(box: { width: number, height: number }, axis: 'x' | 'y'): number[] {
    const size = axis === 'x' ? box.width : box.height
    return [0, size / 2, size]
  }

  // 在该轴所有位置里，找残差(到吸附线的距离)最小的一个候选。每轴只应用这一个最近候选
  // （而非各位置各自吸附互相覆盖），结果对拖拽位置单调、不抖。
  function bestCandidate(
    base: number,
    offsets: number[],
    lines: Set<number>,
    threshold: number,
  ): { line: number, offset: number } | undefined {
    let best: { line: number, offset: number, dist: number } | undefined
    for (const offset of offsets) {
      const pos = base + offset
      const line = closestLine(lines, pos, threshold)
      if (line === undefined) {
        continue
      }
      const dist = Math.abs(line - pos)
      if (!best || dist < best.dist) {
        best = { line, offset, dist }
      }
    }
    return best
  }

  const snap: Mce.Editor['snap'] = (box) => {
    const { axisX, axisY } = getSnapAxes()
    const threshold = snapThreshold.value
    const cx = bestCandidate(box.left, axisOffsets(box, 'x'), axisX, threshold)
    if (cx) {
      box.left = cx.line - cx.offset
    }
    const cy = bestCandidate(box.top, axisOffsets(box, 'y'), axisY, threshold)
    if (cy) {
      box.top = cy.line - cy.offset
    }
  }

  const snapResize: Mce.Editor['snapResize'] = (box, dir) => {
    // 仅吸附单边手柄（t/l/r/b）：角手柄常锁定宽高比，独立吸附某条边会破坏比例。
    if (dir.length !== 1) {
      return
    }
    const { axisX, axisY } = getSnapAxes()
    const th = snapThreshold.value
    const right = box.left + box.width
    const bottom = box.top + box.height
    if (dir === 'l') {
      const s = closestLine(axisX, box.left, th)
      if (s !== undefined && right - s >= 1) {
        box.left = s
        box.width = right - s
      }
    }
    else if (dir === 'r') {
      const s = closestLine(axisX, right, th)
      if (s !== undefined && s - box.left >= 1) {
        box.width = s - box.left
      }
    }
    else if (dir === 't') {
      const s = closestLine(axisY, box.top, th)
      if (s !== undefined && bottom - s >= 1) {
        box.top = s
        box.height = bottom - s
      }
    }
    else if (dir === 'b') {
      const s = closestLine(axisY, bottom, th)
      if (s !== undefined && s - box.top >= 1) {
        box.height = s - box.top
      }
    }
  }

  Object.assign(editor, {
    snappers,
    registerSnapper,
    unregisterSnapper,
    snap,
    snapResize,
  })
})
