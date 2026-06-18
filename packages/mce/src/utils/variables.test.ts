import { describe, expect, it } from 'vitest'
import {
  addCollection,
  addMode,
  addVariable,
  createVariablesState,
  resolveVariable,
  setVariableValue,
} from './variables'

function seed() {
  let s = createVariablesState()
  s = addCollection(s, { id: 'c1', name: 'Theme', mode: { id: 'light', name: 'Light' } })
  s = addMode(s, 'c1', { id: 'dark', name: 'Dark' })
  s = addVariable(s, 'c1', { id: 'bg', name: 'bg', type: 'color', value: '#ffffff' })
  s = setVariableValue(s, 'bg', 'dark', '#000000')
  return s
}

describe('resolveVariable', () => {
  it('按 mode 取值，未知 mode 回退 defaultMode', () => {
    const s = seed()
    expect(resolveVariable(s, 'bg', 'light')).toBe('#ffffff')
    expect(resolveVariable(s, 'bg', 'dark')).toBe('#000000')
    expect(resolveVariable(s, 'bg', 'mobile')).toBe('#ffffff') // 未知 mode → defaultMode(light)
    expect(resolveVariable(s, 'bg')).toBe('#ffffff')
  })

  it('解析别名，并在目标 collection 的 mode 内取值', () => {
    let s = seed()
    s = addVariable(s, 'c1', { id: 'surface', name: 'surface', type: 'color', value: { type: 'alias', id: 'bg' } })
    expect(resolveVariable(s, 'surface', 'light')).toBe('#ffffff')
    expect(resolveVariable(s, 'surface', 'dark')).toBe('#000000')
  })

  it('环引用返回 undefined，不栈溢出', () => {
    let s = seed()
    s = addVariable(s, 'c1', { id: 'x', name: 'x', type: 'color', value: { type: 'alias', id: 'y' } })
    s = addVariable(s, 'c1', { id: 'y', name: 'y', type: 'color', value: { type: 'alias', id: 'x' } })
    expect(resolveVariable(s, 'x', 'light')).toBeUndefined()
  })

  it('未知变量 → undefined', () => {
    expect(resolveVariable(seed(), 'ghost')).toBeUndefined()
  })
})

describe('immutable CRUD', () => {
  it('addVariable 在所有 mode 落同一初值', () => {
    const s = seed()
    const v = s.collections[0].variables.find(v => v.id === 'bg')!
    expect(Object.keys(v.valuesByMode).sort()).toEqual(['dark', 'light'])
  })

  it('操作不修改原状态（immutability）', () => {
    const s0 = seed()
    const snapshot = JSON.stringify(s0)
    setVariableValue(s0, 'bg', 'light', '#eeeeee')
    expect(JSON.stringify(s0)).toBe(snapshot)
  })
})
