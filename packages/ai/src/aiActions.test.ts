import { describe, expect, it } from 'vitest'
import { validateAiActions } from './aiActions'

const existing = new Set(['a', 'b'])
const hasNode = (id: string): boolean => existing.has(id)

describe('validateAiActions', () => {
  it('非数组输入 → 空结果', () => {
    expect(validateAiActions(null)).toEqual({ actions: [], errors: [] })
    expect(validateAiActions({})).toEqual({ actions: [], errors: [] })
  })

  it('createText：缺 text 被拒，合法项保留并清洗非有限数值', () => {
    const r = validateAiActions([
      { type: 'createText', text: 'hi', x: 10, y: Number.NaN },
      { type: 'createText', text: '' },
    ])
    expect(r.actions).toEqual([{ type: 'createText', text: 'hi', x: 10, y: undefined, style: undefined }])
    expect(r.errors).toHaveLength(1)
  })

  it('setStyle / move：引用不存在的 id 被拒', () => {
    const r = validateAiActions([
      { type: 'setStyle', id: 'ghost', style: { color: 'red' } },
      { type: 'move', id: 'b', x: 1, y: 2 },
      { type: 'move', id: 'a', x: 1 },
    ], hasNode)
    expect(r.actions).toEqual([{ type: 'move', id: 'b', x: 1, y: 2 }])
    expect(r.errors).toHaveLength(2)
  })

  it('delete/select/duplicate：过滤不存在 id，全无效则报错', () => {
    const r = validateAiActions([
      { type: 'delete', ids: ['a', 'ghost', 'b'] },
      { type: 'select', ids: ['ghost'] },
    ], hasNode)
    expect(r.actions).toEqual([{ type: 'delete', ids: ['a', 'b'] }])
    expect(r.errors).toHaveLength(1)
  })

  it('align：非法 direction 被拒，合法 direction 保留', () => {
    const r = validateAiActions([
      { type: 'align', direction: 'diagonal' },
      { type: 'align', direction: 'left', ids: ['a', 'ghost'] },
    ], hasNode)
    expect(r.actions).toEqual([{ type: 'align', direction: 'left', ids: ['a'] }])
    expect(r.errors).toHaveLength(1)
  })

  it('未知 type 被拒，但不影响其余合法项', () => {
    const r = validateAiActions([
      { type: 'frobnicate' },
      { type: 'createShape', x: 0, y: 0, fill: '#f00' },
    ])
    expect(r.actions).toEqual([{
      type: 'createShape',
      x: 0,
      y: 0,
      width: undefined,
      height: undefined,
      fill: '#f00',
      path: undefined,
    }])
    expect(r.errors[0]).toMatchObject({ index: 0 })
  })
})
