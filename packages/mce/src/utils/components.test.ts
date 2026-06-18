import { describe, expect, it } from 'vitest'
import { applyOverrides, instantiateComponent, stripNodeIds } from './components'

const master: any = {
  id: 'm0',
  name: 'Card',
  style: { fill: '#fff', width: 100 },
  children: [
    { id: 'm1', text: { content: 'Title' } },
    { id: 'm2', style: { fill: '#eee' } },
  ],
}

describe('stripNodeIds', () => {
  it('递归删除所有层级的 id，保留其余字段', () => {
    const r = stripNodeIds(master) as any
    expect('id' in r).toBe(false)
    expect('id' in r.children[0]).toBe(false)
    expect('id' in r.children[1]).toBe(false)
    expect(r.name).toBe('Card')
    expect(r.children[0].text.content).toBe('Title')
  })

  it('不修改输入', () => {
    const snapshot = JSON.stringify(master)
    stripNodeIds(master)
    expect(JSON.stringify(master)).toBe(snapshot)
  })
})

describe('applyOverrides', () => {
  it('按 lodash 路径覆盖嵌套属性', () => {
    const r = applyOverrides(master, {
      'style.fill': '#000',
      'children.0.text.content': 'Hello',
    }) as any
    expect(r.style.fill).toBe('#000')
    expect(r.children[0].text.content).toBe('Hello')
    expect(r.style.width).toBe(100) // 未覆盖项保留
  })

  it('对象值与原值深合并（只覆盖部分字段，保留其余）', () => {
    const r = applyOverrides(master, { style: { fill: '#000' } }) as any
    expect(r.style.fill).toBe('#000')
    expect(r.style.width).toBe(100) // 深合并 → 未覆盖字段仍在
  })

  it('基本类型整值替换', () => {
    const r = applyOverrides(master, { 'style.width': 200 }) as any
    expect(r.style.width).toBe(200)
  })
})

describe('instantiateComponent', () => {
  it('剥 id + 叠加 override 产出独立实例 JSON', () => {
    const def = { id: 'c1', name: 'Card', node: master }
    const inst = instantiateComponent(def, { 'children.0.text.content': 'Instance A' })
    expect('id' in inst).toBe(false)
    expect('id' in inst.children[0]).toBe(false)
    expect(inst.children[0].text.content).toBe('Instance A')
    expect(inst.style.fill).toBe('#fff')
    // 原 master 不受影响
    expect(master.children[0].text.content).toBe('Title')
  })
})
