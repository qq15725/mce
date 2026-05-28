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
      /** 间距卡点候选位（如 4/8/12/16 间距）。仅当主吸附线(对齐/区域)未命中时作为次选。 */
      xGutters?: number[]
      yGutters?: number[]
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

  // 汇总所有 snapper 提供的吸附线（主线 axis* / 间距卡点次选 gutter*）。
  function getSnapAxes(): {
    axisX: Set<number>
    axisY: Set<number>
    gutterX: Set<number>
    gutterY: Set<number>
  } {
    const axisX = new Set<number>()
    const axisY = new Set<number>()
    const gutterX = new Set<number>()
    const gutterY = new Set<number>()
    snappers.forEach((snapper) => {
      const { xLines, yLines, xGutters, yGutters } = snapper.getLines()
      xLines?.forEach(v => axisX.add(v))
      yLines?.forEach(v => axisY.add(v))
      xGutters?.forEach(v => gutterX.add(v))
      yGutters?.forEach(v => gutterY.add(v))
    })
    return { axisX, axisY, gutterX, gutterY }
  }

  // 在阈值内找离 position 最近的吸附线；超出阈值或无线时返回 undefined。
  function closestLine(lines: Set<number>, position: number): number | undefined {
    let closest: number | undefined
    let minDist = Infinity
    for (const num of lines) {
      const absDist = Math.abs(num - position)
      if (absDist < minDist) {
        minDist = absDist
        closest = num
      }
    }
    return minDist < snapThreshold.value ? closest : undefined
  }

  const snap: Mce.Editor['snap'] = (box) => {
    const { axisX, axisY, gutterX, gutterY } = getSnapAxes()

    // [偏移, 轴, 是否为边]——间距卡点只作用于盒子的边(left/right/top/bottom)，中线不参与。
    const posList: [number, 'x' | 'y', boolean][] = [
      [0, 'x', true],
      [box.width / 2, 'x', false],
      [box.width, 'x', true],
      [0, 'y', true],
      [box.height / 2, 'y', false],
      [box.height, 'y', true],
    ]

    for (let i = 0; i < posList.length; i++) {
      const [offset, axis, isEdge] = posList[i]
      const position = (axis === 'x' ? box.left : box.top) + offset
      // 先吸主线(对齐/区域，间距0)，未命中且是边时再尝试间距卡点，避免 gutter 干扰对齐。
      let closest = closestLine(axis === 'x' ? axisX : axisY, position)
      if (closest === undefined && isEdge) {
        closest = closestLine(axis === 'x' ? gutterX : gutterY, position)
      }
      if (closest === undefined) {
        continue
      }
      if (axis === 'x') {
        box.left = closest - offset
      }
      else {
        box.top = closest - offset
      }
    }
  }

  const snapResize: Mce.Editor['snapResize'] = (box, dir) => {
    // 仅吸附单边手柄（t/l/r/b）：角手柄常锁定宽高比，独立吸附某条边会破坏比例。
    if (dir.length !== 1) {
      return
    }
    const { axisX, axisY, gutterX, gutterY } = getSnapAxes()
    // 边吸附：先对齐线(间距0)，未命中再间距卡点。
    const snapEdge = (main: Set<number>, gutter: Set<number>, pos: number): number | undefined => {
      return closestLine(main, pos) ?? closestLine(gutter, pos)
    }
    const right = box.left + box.width
    const bottom = box.top + box.height
    if (dir === 'l') {
      const s = snapEdge(axisX, gutterX, box.left)
      if (s !== undefined && right - s >= 1) {
        box.left = s
        box.width = right - s
      }
    }
    else if (dir === 'r') {
      const s = snapEdge(axisX, gutterX, right)
      if (s !== undefined && s - box.left >= 1) {
        box.width = s - box.left
      }
    }
    else if (dir === 't') {
      const s = snapEdge(axisY, gutterY, box.top)
      if (s !== undefined && bottom - s >= 1) {
        box.top = s
        box.height = bottom - s
      }
    }
    else if (dir === 'b') {
      const s = snapEdge(axisY, gutterY, bottom)
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
