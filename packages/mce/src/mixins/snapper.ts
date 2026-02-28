import type { Vector2Like } from 'modern-canvas'
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
      get: () => SnapperData
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

  const snap: Mce.Editor['snap'] = (box) => {
    const axisX = new Set<number>()
    const axisY = new Set<number>()

    snappers.forEach((snapper) => {
      const { xLines, yLines } = snapper.get()
      xLines?.forEach(v => axisX.add(v))
      yLines?.forEach(v => axisY.add(v))
    })

    const posList: [number, 'x' | 'y'][] = [
      [0, 'x'],
      [box.width / 2, 'x'],
      [box.width, 'x'],
      [0, 'y'],
      [box.height / 2, 'y'],
      [box.height, 'y'],
    ]

    for (let i = 0; i < posList.length; i++) {
      const [offset, axis] = posList[i]

      let position
      let numArray
      if (axis === 'x') {
        position = box.left + offset
        numArray = axisX
      }
      else {
        position = box.top + offset
        numArray = axisY
      }
      let closest: undefined | number
      let minDist = Infinity
      for (const num of numArray) {
        const dist = num - position
        const absDist = Math.abs(dist)
        if (absDist < minDist) {
          minDist = absDist
          closest = num
        }
      }
      if (minDist < snapThreshold.value) {
        position = closest ?? position
      }
      if (axis === 'x') {
        box.left = position - offset
      }
      else {
        box.top = position - offset
      }
    }
  }

  Object.assign(editor, {
    snappers,
    registerSnapper,
    unregisterSnapper,
    snap,
  })
})
