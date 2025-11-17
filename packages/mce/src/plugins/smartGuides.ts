import type { Element2D } from 'modern-canvas'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import SmartGuides from '../components/SmartGuides.vue'
import { definePlugin } from '../plugin'
import { isOverlappingAabb } from '../utils'
import { BSTree } from '../utils/BSTree'

declare global {
  namespace Mce {
    interface Editor {
      snapThreshold: ComputedRef<number>
      snapLines: ComputedRef<Record<string, any>[]>
      getSnapPoints: (resizing?: boolean) => { x: number[], y: number[] }
    }
  }
}

type LineType = 'vt' | 'vm' | 'vb' | 'hl' | 'hm' | 'hr'

interface Line {
  pos: number
  type: LineType
  box?: Box
}

interface Box {
  id: number
  vt: Line
  vm: Line
  vb: Line
  hl: Line
  hm: Line
  hr: Line
  // node: HTMLElement;
  // instance: ComponentInstance;
}

type LinePairType = 'distance' | 'alignment' | 'spacing' | 'area'

interface LinePair {
  source: Line
  target: Line
  type: LinePairType
  distance: number
  _ctx?: Record<string, any>
}

interface BoundingBox {
  left: number
  top: number
  width: number
  height: number
  rotate?: number
}

export default definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    selectionObb,
    state,
    getObb,
    root,
    camera,
  } = editor

  const snapThreshold = computed(() => Math.max(1, 5 / camera.value.zoom.x))
  const excluded = computed(() => {
    return new Set(
      [elementSelection.value[0]?.id].filter(Boolean),
    )
  })
  const activeBox = computed(() => createBox(selectionObb.value)!)
  const parnet = computed(() => elementSelection.value[0]?.parent ?? root.value)
  const parentBox = computed(() => createBox(parnet.value)!)
  const boxes = computed(() => {
    return parnet.value
      .children
      .filter(node => !excluded.value.has(node.id))
      .map(node => createBox(node as Element2D)!)
      .filter(Boolean) as Box[]
  })

  const store = computed(() => {
    return boxes.value.reduce(
      (store, box) => {
        [box.vt, box.vm, box.vb].forEach(val => store.vLines.add(val));
        [box.hl, box.hm, box.hr].forEach(val => store.hLines.add(val))
        return store
      },
      {
        vLines: new BSTree<Line>((a, b) => a.pos - b.pos),
        hLines: new BSTree<Line>((a, b) => a.pos - b.pos),
      },
    )
  })

  function createBox(node?: Element2D | BoundingBox | undefined): Box | undefined {
    if (!node)
      return undefined
    const box = {} as Box
    let top: number
    let left: number
    let height: number
    let width: number
    if (isElement(node)) {
      box.id = node.id
      ;({ top, left, height, width } = getObb(node))
    }
    else {
      box.id = Math.random()
      ;({ top, left, height, width } = node)
    }
    box.vt = createLine(top, 'vt', box)
    box.vm = createLine(top + height / 2, 'vm', box)
    box.vb = createLine(top + height, 'vb', box)
    box.hl = createLine(left, 'hl', box)
    box.hm = createLine(left + width / 2, 'hm', box)
    box.hr = createLine(left + width, 'hr', box)
    return box
  }

  function isCanvasLine(line: Line) {
    return line.box?.id === -1
  }

  function findLines(targets: BSTree<Line>, source: Line) {
    const axis = ['vt', 'vb'].includes(source.type) ? 'vertical' : 'horizontal'
    const flippedAxis = axis === 'vertical' ? 'horizontal' : 'vertical'
    const isLeftTop = isLeftTopLine(source)
    let type = flipType(source.type)
    if (isLeftTop) {
      if (source.pos > parentBox.value[type].pos)
        return []
    }
    else {
      if (source.pos < parentBox.value[type].pos)
        return []
    }
    const items: Line[] = []
    let prev: Line
    const forEach = (target: Line) => {
      if (['vm', 'hm'].includes(target.type))
        return
      if (isLeftTop) {
        if (source.pos < target.pos)
          return
      }
      else {
        if (source.pos > target.pos)
          return
      }
      const isCanvas = isCanvasLine(target)
      if (type !== target.type && !isCanvas)
        return
      if (!isOverlappingAabb(toBoundingBox(source), toBoundingBox(target), flippedAxis))
        return
      if (
        !isCanvas
        && prev
        && prev.box!.id !== target.box!.id
        && isOverlappingAabb(toBoundingBox(prev), toBoundingBox(target), axis)
      ) {
        return
      }
      prev = target
      items.push(target)
      type = flipType(type)
    }

    if (isLeftTop) {
      targets.outorderTraversal(forEach)
    }
    else {
      targets.inorderTraversal(forEach)
    }

    return items
  }

  function findAreas(targets: Line[], line: Line): LinePair[] {
    if (!targets.length)
      return []
    const isLeftTop = isLeftTopLine(line)
    const closestPos = targets[0].pos
    let prevDistance = Math.abs(line.pos - closestPos)
    const areas: LinePair[] = []
    targets = [line].concat(targets)
    for (let i = 0; i < targets.length; i += 2) {
      const source = targets[i]
      const target = targets[i + 1]
      if (!target)
        break
      const distance = Math.abs(target.pos - source.pos)
      if (i === 2) {
        if (Math.abs(prevDistance - distance) > snapThreshold.value)
          break
        prevDistance = distance
      }
      else {
        if (Math.abs(prevDistance - distance) > 1)
          break
      }
      areas.push({ target, source, type: 'area', distance })
    }
    if (areas.length < 2)
      return []
    areas[0]._ctx = {
      type: line.type,
      pos: isLeftTop ? closestPos + prevDistance : closestPos - prevDistance,
    }
    return areas
  }

  const linePairs = computed(() => {
    const { vLines, hLines } = store.value
    const box = activeBox.value
    const areaLine: Record<'vt' | 'vb' | 'hl' | 'hr', Line[]> = { vt: [], vb: [], hl: [], hr: [] }
    const linePairs: LinePair[] = [];

    [
      { sources: [box.vt, box.vm, box.vb], targets: vLines },
      { sources: [box.hl, box.hm, box.hr], targets: hLines },
    ].forEach(({ targets, sources }) => {
      for (const source of sources) {
        const target = targets.searchClosest(source, (a, b, c) => {
          return !c || Math.abs(a.pos - b.pos) < Math.abs(a.pos - c.pos)
        })
        if (!target)
          continue
        const distance = Math.abs(target.pos - source.pos)
        if (distance >= snapThreshold.value)
          continue
        linePairs.push({ source, target, type: 'alignment', distance })
      }
    });

    (
      [
        { sources: [box.vt, box.vb], targets: vLines },
        { sources: [box.hl, box.hr], targets: hLines },
      ] as const
    ).forEach(({ sources, targets }) => {
      for (const source of sources) {
        areaLine[source.type as keyof typeof areaLine] = findLines(targets, source)
      }
    })

    areaLine.vt = areaLine.vt.sort((a, b) => b.pos - a.pos)
    areaLine.hl = areaLine.hl.sort((a, b) => b.pos - a.pos);

    // TODO 两边区域相等时，同方向区域相等也应该可以显示
    (
      [
        { targets: [areaLine.vt, areaLine.vb], sources: [box.vt, box.vb] },
        { targets: [areaLine.hl, areaLine.hr], sources: [box.hl, box.hr] },
      ] as const
    ).forEach(({ sources, targets }) => {
      const targetA = targets[0][0]
      const sourceA = sources[0]
      const targetB = targets[1][0]
      const sourceB = sources[1]

      if (targetA && targetB && (!isCanvasLine(targetA) || !isCanvasLine(targetB))) {
        const distanceA = Math.abs(sourceA.pos - targetA.pos)
        const distanceB = Math.abs(sourceB.pos - targetB.pos)
        if (Math.abs(distanceA - distanceB) < snapThreshold.value) {
          const isLeftTop = isLeftTopLine(sourceA)
          linePairs.push({
            target: targetA,
            source: sourceA,
            type: 'area',
            distance: distanceA,
            _ctx: {
              type: sourceA.type,
              pos: isLeftTop
                ? targetA.pos + (distanceA + distanceB) / 2
                : targetA.pos - (distanceA + distanceB) / 2,
            },
          })
          linePairs.push({
            target: targetB,
            source: sourceB,
            type: 'area',
            distance: distanceB,
          })
          return
        }
      }

      for (const i in sources) {
        const areas = findAreas(targets[i], sources[i])
        if (areas.length) {
          linePairs.push(...areas)
          break
        }
      }
    })

    return linePairs
  })

  const snapLines = computed(() => {
    if (state.value !== 'transforming')
      return []
    const { zoom, position } = camera.value

    const scaleX = (v: number) => v * zoom.x
    const scaleY = (v: number) => v * zoom.y

    return linePairs.value.map((linePair) => {
      const { target, source, type } = linePair

      const boxSource = source.box!
      const boxTarget = target.box!
      const vertical = ['vt', 'vm', 'vb'].includes(target.type)

      const itemProps: Record<string, any> = {}

      switch (type) {
        case 'alignment': {
          itemProps.class = ['alignment']

          if (vertical) {
            const left = Math.min(boxSource.hl.pos, boxTarget.hl.pos)
            const right = Math.max(boxSource.hr.pos, boxTarget.hr.pos)
            itemProps.style = {
              left: scaleX(left) - position.left,
              top: scaleY(target.pos) - position.top,
              width: scaleX(right - left),
              height: 1,
            }
          }
          else {
            const top = Math.min(boxTarget.vt.pos, boxSource.vt.pos)
            const bottom = Math.max(boxTarget.vb.pos, boxSource.vb.pos)
            itemProps.style = {
              left: scaleX(target.pos) - position.left,
              top: scaleY(top) - position.top,
              width: 1,
              height: scaleY(bottom - top),
            }
          }
          break
        }
        case 'area': {
          itemProps.class = ['area']
          if (vertical) {
            itemProps.class.push('area--vertical')
          }

          const isCanvas = isCanvasLine(target) || isCanvasLine(source)

          if (vertical) {
            const top = Math.min(source.pos, target.pos)
            const left = isCanvas
              ? Math.max(boxSource.hl.pos, boxTarget.hl.pos)
              : Math.min(boxSource.hl.pos, boxTarget.hl.pos)
            const right = isCanvas
              ? Math.min(boxSource.hr.pos, boxTarget.hr.pos)
              : Math.max(boxSource.hr.pos, boxTarget.hr.pos)
            itemProps.style = {
              left: scaleX(left) - position.left,
              top: scaleY(top) - position.top,
              width: scaleX(right - left),
              height: scaleY(linePair.distance),
            }
          }
          else {
            const min = Math.min(source.pos, target.pos)
            const top = isCanvas
              ? Math.max(boxTarget.vt.pos, boxSource.vt.pos)
              : Math.min(boxTarget.vt.pos, boxSource.vt.pos)
            const bottom = isCanvas
              ? Math.min(boxTarget.vb.pos, boxSource.vb.pos)
              : Math.max(boxTarget.vb.pos, boxSource.vb.pos)
            itemProps.style = {
              left: scaleX(min) - position.left,
              top: scaleY(top) - position.top,
              width: scaleX(linePair.distance),
              height: scaleY(bottom - top),
            }
          }
          break
        }
      }

      return itemProps
    })
  })

  function getSnapPoints(resizing = false): { x: number[], y: number[] } {
    const x: number[] = []
    const y: number[] = []
    for (const linePair of linePairs.value) {
      const { target, source, type } = linePair
      const boxTarget = target.box!
      const boxSource = source.box!
      if (type === 'alignment') {
        const width = boxSource.hr.pos - boxSource.hl.pos
        const height = boxSource.vb.pos - boxSource.vt.pos
        let value = boxTarget[target.type].pos
        if (['vt', 'vm', 'vb'].includes(target.type)) {
          if (!resizing) {
            if (source.type === 'vm') {
              value -= height / 2
            }
            else if (source.type === 'vb') {
              value -= height
            }
          }
          y.push(value)
        }
        else {
          if (!resizing) {
            if (source.type === 'hm') {
              value -= width / 2
            }
            else if (source.type === 'hr') {
              value -= width
            }
          }
          x.push(value)
        }
      }
      else if (type === 'area') {
        if (!linePair._ctx)
          continue
        const { type, pos } = linePair._ctx as any
        if (pos === undefined)
          continue
        if (['vt', 'vb'].includes(type)) {
          y.push(pos)
        }
        else {
          x.push(pos)
        }
      }
    }
    return { x, y }
  }

  Object.assign(editor, {
    snapThreshold,
    snapLines,
    getSnapPoints,
  })

  return {
    name: 'mce:smartGuides',
    components: [
      { type: 'overlay', component: SmartGuides },
    ],
  }
})

function createLine(pos: number, type: LineType, box?: Box): Line {
  return { pos, type, box }
}

function toBoundingBox(value: Line | Box) {
  const box = ('box' in value ? value.box : value) as Box
  return {
    left: box.hl.pos,
    top: box.vt.pos,
    width: box.hr.pos - box.hl.pos,
    height: box.vb.pos - box.vt.pos,
  }
}

function flipType(type: string): LineType {
  if (type === 'vt')
    return 'vb'
  if (type === 'vb')
    return 'vt'
  if (type === 'hl')
    return 'hr'
  if (type === 'hr')
    return 'hl'
  return type as LineType
}

function isLeftTopLine(line: Line) {
  return ['vt', 'hl'].includes(line.type)
}
