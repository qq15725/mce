/**
 * # 辅助线
 * 一个辅助对齐插件
 * ## Feature
 * - 显示对齐辅助
 *   - 对齐线 √
 *   - 距离线 √（移动盒子中线到最近兄弟盒子，带像素值）
 *   - 间距线 √（以带数值的等距间距块呈现）
 *   - 间距块 √
 * - 自动吸附
 *   - 对齐时吸附 √
 *   - 减少距离时（如 4/8/12/16）吸附 √（gutter 卡点，对齐优先、间距卡点次之）
 *   - 调整大小时吸附 √（仅单边手柄）
 *   - 画板边界吸附 √（仅真实画板 Frame）
 * 参考资料:
 * @link https://zhuanlan.zhihu.com/p/92469406 《云凤蝶如何打造媲美 sketch 的自由画布》
 */
import type { Node } from 'modern-canvas'
import { Aabb2D } from 'modern-canvas'
import { computed, h, ref } from 'vue'
import SmartGuides from '../components/SmartGuides.vue'
import { definePlugin } from '../plugin'
import { BSTree } from '../utils/BSTree'

type LineType = 'vt' | 'vm' | 'vb' | 'hl' | 'hm' | 'hr'

interface Line {
  pos: number
  type: LineType
  box?: Box
}

interface Box {
  id: number | string
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
    isNode,
    isElement,
    isFrameNode,
    elementSelection,
    selectionAabb,
    getAabb,
    root,
    camera,
    viewportAabb,
    registerSnapper,
  } = editor

  const snapThreshold = computed(() => Math.max(1, 5 / camera.value.zoom.x))
  const parent = computed(() => elementSelection.value[0]?.parent ?? root.value)
  const parentBox = computed(() => createBox(parent.value))

  function createBox(node?: Node | BoundingBox | undefined): Box | undefined {
    if (!node)
      return undefined

    const box = {} as Box
    let top: number
    let left: number
    let height: number
    let width: number
    if (isNode(node)) {
      if (isElement(node)) {
        box.id = node.id
        ;({ top, left, height, width } = getAabb(node))
      }
      else {
        return undefined
      }
    }
    else {
      box.id = Math.random()
      ;({ top, left, height, width } = node)
    }
    if (!width || !height) {
      return undefined
    }
    box.vt = createLine(top, 'vt', box)
    box.vm = createLine(top + height / 2, 'vm', box)
    box.vb = createLine(top + height, 'vb', box)
    box.hl = createLine(left, 'hl', box)
    box.hm = createLine(left + width / 2, 'hm', box)
    box.hr = createLine(left + width, 'hr', box)
    return box
  }

  // 画板（Frame）边界作为吸附目标：把它的 6 条线（边 + 中线）标记为 canvas line（id=-1），
  // 让元素能对齐到画板边/中线、或相对画板两边等距。仅对真实画板生效——root 无限画布无边界。
  function createCanvasBox(): Box | undefined {
    const p = parent.value
    if (!isNode(p) || !isFrameNode(p))
      return undefined
    const box = createBox(p)
    if (box)
      box.id = -1
    return box
  }

  function isCanvasLine(line: Line) {
    return line.box?.id === -1
  }

  function findLines(targets: BSTree<Line>, source: Line) {
    const axis = ['vt', 'vb'].includes(source.type) ? 'y' : 'x'
    const flippedAxis = axis === 'y' ? 'x' : 'y'
    const isLeftTop = isLeftTopLine(source)
    let type = flipType(source.type)
    if (parentBox.value) {
      if (isLeftTop) {
        if (source.pos > parentBox.value[type].pos)
          return []
      }
      else {
        if (source.pos < parentBox.value[type].pos)
          return []
      }
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
      if (!toBoundingBox(source).overlap(toBoundingBox(target), flippedAxis))
        return
      if (
        !isCanvas
        && prev
        && prev.box!.id !== target.box!.id
        && toBoundingBox(prev).overlap(toBoundingBox(target), axis)
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
      pos: isLeftTop
        ? closestPos + prevDistance
        : closestPos - prevDistance,
    }
    return areas
  }

  // 距离线：从移动盒子中线出发，到「同向有重叠、之间有正间距」的最近兄弟盒子，每轴最多 1 条。
  // 不含画板边界（容器是包含关系，非相邻间距）。
  function findDistancePairs(box: Box, boxes: Box[]): LinePair[] {
    const moving = toBoundingBox(box)
    let bestV: { gap: number, below: boolean, nb: Box } | undefined
    let bestH: { gap: number, after: boolean, nb: Box } | undefined
    for (const nb of boxes) {
      if (nb.id === -1)
        continue
      const b = toBoundingBox(nb)
      if (moving.overlap(b, 'x')) {
        const below = nb.vt.pos - box.vb.pos
        const above = box.vt.pos - nb.vb.pos
        if (below > 0 && (!bestV || below < bestV.gap))
          bestV = { gap: below, below: true, nb }
        if (above > 0 && (!bestV || above < bestV.gap))
          bestV = { gap: above, below: false, nb }
      }
      if (moving.overlap(b, 'y')) {
        const after = nb.hl.pos - box.hr.pos
        const before = box.hl.pos - nb.hr.pos
        if (after > 0 && (!bestH || after < bestH.gap))
          bestH = { gap: after, after: true, nb }
        if (before > 0 && (!bestH || before < bestH.gap))
          bestH = { gap: before, after: false, nb }
      }
    }
    const pairs: LinePair[] = []
    if (bestV) {
      pairs.push({
        source: bestV.below ? box.vb : box.vt,
        target: bestV.below ? bestV.nb.vt : bestV.nb.vb,
        type: 'distance',
        distance: bestV.gap,
      })
    }
    if (bestH) {
      pairs.push({
        source: bestH.after ? box.hr : box.hl,
        target: bestH.after ? bestH.nb.hl : bestH.nb.hr,
        type: 'distance',
        distance: bestH.gap,
      })
    }
    return pairs
  }

  const linePairs = ref<LinePair[]>([])
  // 间距卡点候选：邻居边按这些间距偏移后的位置，作为吸附次选（“减少距离时吸附”，Ant Gutter 思路）。
  const gutterPoints = ref<{ x: number[], y: number[] }>({ x: [], y: [] })
  const GUTTERS = [4, 8, 12, 16]

  function updateSmartGuides(handle = 'move') {
    const _linePairs: LinePair[] = []
    const _gutterX: number[] = []
    const _gutterY: number[] = []
    // resize 时只用被拖动的边作对齐源：每轴最终只保留“最近的一条”对齐线，若沿用全部 6 条边，
    // 保留的那条可能落在未拖动的边上，导致吸附目标与实际在动的边错配。
    const resizeDir = handle.startsWith('resize') ? handle.split('-')[1] ?? '' : ''

    const box = createBox(selectionAabb.value)

    if (box) {
      const excluded = new Set(elementSelection.value.map(el => el.instanceId))
      const boxes = parent.value
        .children
        .filter((node) => {
          return !excluded.has(node.instanceId)
            && isElement(node)
            // Connection lines are route-positioned; don't snap others to them.
            && !(node as any).connection?.isValid()
            && viewportAabb.value.overlap(node.globalAabb)
        })
        .map(node => createBox(node)!)
        .filter(Boolean) as Box[]

      // 画板边界线追加在兄弟元素之后（BSTree.add 按 pos 去重，同位置时保留先加入的元素线）。
      const canvasBox = createCanvasBox()
      if (canvasBox)
        boxes.push(canvasBox)

      const { vLines, hLines } = boxes.reduce(
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

      // 间距卡点候选 = 每条邻居边按 ±GUTTERS 偏移；中线(hm/vm)不参与（间距卡点只针对边）。
      hLines.inorderTraversal((line) => {
        if (line.type === 'hm')
          return
        for (const g of GUTTERS) _gutterX.push(line.pos + g, line.pos - g)
      })
      vLines.inorderTraversal((line) => {
        if (line.type === 'vm')
          return
        for (const g of GUTTERS) _gutterY.push(line.pos + g, line.pos - g)
      })

      const areaLine: Record<'vt' | 'vb' | 'hl' | 'hr', Line[]> = {
        vt: [],
        vb: [],
        hl: [],
        hr: [],
      }

      const alignmentItems = [
        {
          sources: resizeDir
            ? [resizeDir.includes('t') && box.vt, resizeDir.includes('b') && box.vb].filter(Boolean) as Line[]
            : [box.vt, box.vm, box.vb],
          targets: vLines,
        },
        {
          sources: resizeDir
            ? [resizeDir.includes('l') && box.hl, resizeDir.includes('r') && box.hr].filter(Boolean) as Line[]
            : [box.hl, box.hm, box.hr],
          targets: hLines,
        },
      ]
      alignmentItems.forEach(({ targets, sources }) => {
        const items: LinePair[] = []
        for (const source of sources) {
          const target = targets.searchClosest(source, (a, b, c) => {
            return !c || Math.abs(a.pos - b.pos) < Math.abs(a.pos - c.pos)
          })
          if (!target) {
            continue
          }
          const distance = Math.abs(target.pos - source.pos)
          if (distance >= snapThreshold.value) {
            continue
          }
          items.push({ source, target, type: 'alignment', distance })
        }
        items.sort((a, b) => a.distance - b.distance)
        if (items.length) {
          _linePairs.push(items[0])
        }
      })

      const areaLineItems = [
        { sources: [box.vt, box.vb], targets: vLines },
        { sources: [box.hl, box.hr], targets: hLines },
      ]

      areaLineItems.forEach(({ sources, targets }) => {
        for (const source of sources) {
          areaLine[source.type as keyof typeof areaLine] = findLines(targets, source)
        }
      })
      areaLine.vt = areaLine.vt.sort((a, b) => b.pos - a.pos)
      areaLine.hl = areaLine.hl.sort((a, b) => b.pos - a.pos)

      // TODO 两边区域相等时，同方向区域相等也应该可以显示
      // resize 只做被拖动边的对齐吸附，不计算等距区域（area）。
      const areaItems = resizeDir
        ? []
        : [
            { targets: [areaLine.vt, areaLine.vb], sources: [box.vt, box.vb] },
            { targets: [areaLine.hl, areaLine.hr], sources: [box.hl, box.hr] },
          ]
      areaItems.forEach(({ sources, targets }) => {
        const targetA = targets[0][0]
        const sourceA = sources[0]
        const targetB = targets[1][0]
        const sourceB = sources[1]

        if (targetA && targetB && (!isCanvasLine(targetA) || !isCanvasLine(targetB))) {
          const distanceA = Math.abs(sourceA.pos - targetA.pos)
          const distanceB = Math.abs(sourceB.pos - targetB.pos)
          if (Math.abs(distanceA - distanceB) < snapThreshold.value) {
            const isLeftTop = isLeftTopLine(sourceA)
            _linePairs.push({
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
            _linePairs.push({
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
            _linePairs.push(...areas)
            break
          }
        }
      })

      // 距离线（仅移动时）：最低优先级，仅在该方向尚无对齐线/间距块时出现，
      // 避免同一方向重复出现多条（距离线与 area 表达的是同一段间距）。
      if (!resizeDir) {
        const isV = (t: LineType): boolean => t === 'vt' || t === 'vm' || t === 'vb'
        const hasV = _linePairs.some(p => isV(p.target.type))
        const hasH = _linePairs.some(p => !isV(p.target.type))
        for (const pair of findDistancePairs(box, boxes)) {
          if (isV(pair.target.type) ? !hasV : !hasH)
            _linePairs.push(pair)
        }
      }
    }

    linePairs.value = _linePairs
    gutterPoints.value = { x: _gutterX, y: _gutterY }
  }

  const snapLines = computed(() => {
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
          // 间距块上标注间距像素值（即“间距线 / spacing”的数值反馈）。
          itemProps.label = String(Math.round(linePair.distance))
          break
        }
        case 'distance': {
          itemProps.class = ['distance']
          if (vertical) {
            itemProps.class.push('distance--vertical')
            const top = Math.min(source.pos, target.pos)
            itemProps.style = {
              left: scaleX(boxSource.hm.pos) - position.left,
              top: scaleY(top) - position.top,
              width: 1,
              height: scaleY(linePair.distance),
            }
          }
          else {
            const left = Math.min(source.pos, target.pos)
            itemProps.style = {
              left: scaleX(left) - position.left,
              top: scaleY(boxSource.vm.pos) - position.top,
              width: scaleX(linePair.distance),
              height: 1,
            }
          }
          itemProps.label = String(Math.round(linePair.distance))
          break
        }
      }

      return itemProps
    })
  })

  function getSnapPoints(): { x: number[], y: number[] } {
    const x: number[] = []
    const y: number[] = []
    for (const linePair of linePairs.value) {
      const { target, type } = linePair
      const boxTarget = target.box!
      if (type === 'alignment') {
        const value = boxTarget[target.type].pos
        if (['vt', 'vm', 'vb'].includes(target.type)) {
          y.push(value)
        }
        else {
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

  registerSnapper('smartGuides', {
    getLines: () => {
      const lines = getSnapPoints()
      return {
        xLines: lines.x,
        yLines: lines.y,
        xGutters: gutterPoints.value.x,
        yGutters: gutterPoints.value.y,
      }
    },
  })

  return {
    name: 'mce:smartGuides',
    events: {
      selectionTransformed: ({ handle }) => {
        // move 与单边 resize（resize-t/l/r/b）显示参考线；角手柄常锁宽高比，暂不处理。
        if (handle === 'move' || /^resize-[tlrb]$/.test(handle)) {
          updateSmartGuides(handle)
        }
      },
      selectionTransformEnded: () => {
        linePairs.value = []
        gutterPoints.value = { x: [], y: [] }
      },
    },
    components: [
      {
        type: 'overlay',
        component: () => h(SmartGuides, { snapLines: snapLines.value }),
      },
    ],
  }
})

function createLine(pos: number, type: LineType, box?: Box): Line {
  return { pos, type, box }
}

function toBoundingBox(value: Line | Box): Aabb2D {
  const box = ('box' in value ? value.box : value) as Box
  return new Aabb2D({
    x: box.hl.pos,
    y: box.vt.pos,
    width: box.hr.pos - box.hl.pos,
    height: box.vb.pos - box.vt.pos,
  })
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
