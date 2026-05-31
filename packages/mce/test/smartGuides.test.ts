import type { Box } from '../src/utils/smartGuides-geometry'
import { describe, expect, it } from 'vitest'
import {
  createLine,
  findDistancePairs,
  flipType,
  isLeftTopLine,
  toBoundingBox,
} from '../src/utils/smartGuides-geometry'

// 测试用 box 工厂：与插件内 createBox 一致的 6 线结构，便于无 editor 直接构造。
function makeBox(id: number | string, left: number, top: number, width: number, height: number): Box {
  const box = {} as Box
  box.id = id
  box.vt = createLine(top, 'vt', box)
  box.vm = createLine(top + height / 2, 'vm', box)
  box.vb = createLine(top + height, 'vb', box)
  box.hl = createLine(left, 'hl', box)
  box.hm = createLine(left + width / 2, 'hm', box)
  box.hr = createLine(left + width, 'hr', box)
  return box
}

describe('flipType', () => {
  it('flips top/bottom and left/right pairs', () => {
    expect(flipType('vt')).toBe('vb')
    expect(flipType('vb')).toBe('vt')
    expect(flipType('hl')).toBe('hr')
    expect(flipType('hr')).toBe('hl')
  })

  it('returns middle lines unchanged', () => {
    expect(flipType('vm')).toBe('vm')
    expect(flipType('hm')).toBe('hm')
  })
})

describe('isLeftTopLine', () => {
  it('vt and hl are left-top', () => {
    expect(isLeftTopLine({ pos: 0, type: 'vt' })).toBe(true)
    expect(isLeftTopLine({ pos: 0, type: 'hl' })).toBe(true)
  })

  it('vb / hr / center lines are not', () => {
    expect(isLeftTopLine({ pos: 0, type: 'vb' })).toBe(false)
    expect(isLeftTopLine({ pos: 0, type: 'hr' })).toBe(false)
    expect(isLeftTopLine({ pos: 0, type: 'vm' })).toBe(false)
    expect(isLeftTopLine({ pos: 0, type: 'hm' })).toBe(false)
  })
})

describe('toBoundingBox', () => {
  it('converts Box to Aabb2D-like geometry', () => {
    const box = makeBox('a', 10, 20, 30, 40)
    const aabb = toBoundingBox(box)
    expect(aabb.left).toBe(10)
    expect(aabb.top).toBe(20)
    expect(aabb.width).toBe(30)
    expect(aabb.height).toBe(40)
  })
})

describe('findDistancePairs', () => {
  const moving = makeBox('m', 0, 0, 100, 100)

  it('returns [] with no neighbors', () => {
    expect(findDistancePairs(moving, [])).toEqual([])
  })

  it('detects vertical gap below (source=vb, target=vt)', () => {
    const below = makeBox('b', 0, 150, 100, 100) // 50px gap below
    const pairs = findDistancePairs(moving, [below])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].type).toBe('distance')
    expect(pairs[0].distance).toBe(50)
    expect(pairs[0].source.type).toBe('vb')
    expect(pairs[0].target.type).toBe('vt')
  })

  it('detects vertical gap above (source=vt, target=vb)', () => {
    const ref = makeBox('m', 0, 200, 100, 100)
    const above = makeBox('a', 0, 0, 100, 100) // 100px gap above
    const pairs = findDistancePairs(ref, [above])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].source.type).toBe('vt')
    expect(pairs[0].target.type).toBe('vb')
    expect(pairs[0].distance).toBe(100)
  })

  it('detects horizontal gap (source=hr, target=hl)', () => {
    const right = makeBox('r', 150, 0, 100, 100)
    const pairs = findDistancePairs(moving, [right])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].source.type).toBe('hr')
    expect(pairs[0].target.type).toBe('hl')
    expect(pairs[0].distance).toBe(50)
  })

  it('yields at most one per axis (vertical + horizontal)', () => {
    const below = makeBox('b', 0, 150, 100, 100)
    const right = makeBox('r', 150, 0, 100, 100)
    const pairs = findDistancePairs(moving, [below, right])
    expect(pairs).toHaveLength(2)
    const types = pairs.map(p => p.target.type).sort()
    expect(types).toEqual(['hl', 'vt'])
  })

  it('skips neighbors without perpendicular overlap', () => {
    const offset = makeBox('o', 500, 150, 100, 100) // far right + below, no x overlap
    expect(findDistancePairs(moving, [offset])).toEqual([])
  })

  it('skips overlapping boxes (gap not positive)', () => {
    const overlap = makeBox('o', 50, 50, 100, 100) // overlaps both axes
    expect(findDistancePairs(moving, [overlap])).toEqual([])
  })

  it('picks the closest among multiple candidates on the same side', () => {
    const near = makeBox('n', 0, 120, 100, 100) // gap 20
    const far = makeBox('f', 0, 300, 100, 100) // gap 200
    const pairs = findDistancePairs(moving, [near, far])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].distance).toBe(20)
  })

  it('ignores canvas box (id = -1)', () => {
    const frame = makeBox(-1, -200, -200, 600, 600) // container, contains moving
    expect(findDistancePairs(moving, [frame])).toEqual([])
  })
})
