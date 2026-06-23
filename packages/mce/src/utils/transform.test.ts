import { describe, expect, it } from 'vitest'
import { parseTransform, serializeTransform, setTransformField, transformFields } from './transform'

describe('parseTransform', () => {
  it('解析函数与单位', () => {
    const fns = parseTransform('translate3d(100%, 0, 0) skewX(-30deg)')
    expect(fns).toEqual([
      { name: 'translate3d', args: [{ value: 100, unit: '%' }, { value: 0, unit: '' }, { value: 0, unit: '' }] },
      { name: 'skewX', args: [{ value: -30, unit: 'deg' }] },
    ])
  })

  it('小数与负值', () => {
    const fns = parseTransform('scale3d(.475, .475, .475) translate3d(0, -60px, 0)')
    expect(fns[0].args[0]).toEqual({ value: 0.475, unit: '' })
    expect(fns[1].args[1]).toEqual({ value: -60, unit: 'px' })
  })
})

describe('serializeTransform 往返', () => {
  it('保留顺序与单位', () => {
    const s = 'translate3d(100%, 0, 0) rotate3d(0, 0, 1, 45deg)'
    expect(serializeTransform(parseTransform(s))).toBe(s)
  })
})

describe('transformFields', () => {
  it('只暴露有意义的参数（rotate3d 仅角度）', () => {
    const fields = transformFields(parseTransform('translate3d(50%, 0, 0) rotate3d(0, 0, 1, 45deg)'))
    expect(fields.map(f => f.label)).toEqual(['X', 'Y', '°'])
    expect(fields.find(f => f.label === '°')).toMatchObject({ value: 45, unit: 'deg', argIndex: 3 })
  })
})

describe('setTransformField', () => {
  it('改某分量并序列化回字符串', () => {
    const fns = parseTransform('translate3d(50%, 0, 0)')
    expect(setTransformField(fns, 0, 1, 30)).toBe('translate3d(50%, 30, 0)')
  })
})
