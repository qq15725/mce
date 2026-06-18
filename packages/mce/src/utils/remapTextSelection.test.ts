import type { NormalizedTextContent } from 'modern-idoc'
import { describe, expect, it } from 'vitest'
import { offsetToPointer, paragraphCharOffset, remapTextSelection } from './remapTextSelection'

function P(...contents: string[]): NormalizedTextContent[number] {
  return { fragments: contents.map(content => ({ content })) }
}

describe('paragraphCharOffset', () => {
  it('累加前置片段长度 + charIndex', () => {
    const content = [P('He', 'llo')]
    expect(paragraphCharOffset(content, { paragraphIndex: 0, fragmentIndex: 0, charIndex: 1 })).toBe(1)
    expect(paragraphCharOffset(content, { paragraphIndex: 0, fragmentIndex: 1, charIndex: 2 })).toBe(4)
  })
})

describe('offsetToPointer', () => {
  it('把绝对偏移落回正确片段', () => {
    const content = [P('He', 'llo')]
    expect(offsetToPointer(content, 0, 1)).toEqual({ fragmentIndex: 0, charIndex: 1 })
    expect(offsetToPointer(content, 0, 4)).toEqual({ fragmentIndex: 1, charIndex: 2 })
  })

  it('末片段兜底吸收末尾溢出（选区端点指向最后一字符之后）', () => {
    const content = [P('He', 'llo')]
    expect(offsetToPointer(content, 0, 5)).toEqual({ fragmentIndex: 1, charIndex: 3 })
  })
})

describe('remapTextSelection', () => {
  it('片段被拆分后，按段内绝对偏移重映射并保留其余字段', () => {
    // 旧：单片段 "Hello"；选中 [c1, c4)。设样式后拆成 "He" | "llo"。
    const oldContent = [P('Hello')]
    const newContent = [P('He', 'llo')]
    const sel: [any, any] = [
      { paragraphIndex: 0, fragmentIndex: 0, charIndex: 1, isFirst: true, left: 10 },
      { paragraphIndex: 0, fragmentIndex: 0, charIndex: 4, isLastSelected: true, left: 40 },
    ]
    const [start, end] = remapTextSelection(oldContent, newContent, sel)
    expect(start).toMatchObject({ paragraphIndex: 0, fragmentIndex: 0, charIndex: 1, isFirst: true, left: 10 })
    expect(end).toMatchObject({ paragraphIndex: 0, fragmentIndex: 1, charIndex: 2, isLastSelected: true, left: 40 })
  })

  it('片段合并后同样收敛到正确位置', () => {
    // 旧：三片段；新：合并成单片段。end 指针 (f2,c1) → 绝对 4 → 单片段 (f0,c4)。
    const oldContent = [P('H', 'ell', 'o')]
    const newContent = [P('Hello')]
    const sel: [any, any] = [
      { paragraphIndex: 0, fragmentIndex: 0, charIndex: 0 },
      { paragraphIndex: 0, fragmentIndex: 2, charIndex: 1 },
    ]
    const [start, end] = remapTextSelection(oldContent, newContent, sel)
    expect(start).toMatchObject({ fragmentIndex: 0, charIndex: 0 })
    // end (f2='o', c1) → 段内绝对偏移 1+3+1 = 5（'o' 之后）→ 合并后单片段的 c5。
    expect(end).toMatchObject({ fragmentIndex: 0, charIndex: 5 })
  })

  it('多段落：仅在端点所属段落内重定位，paragraphIndex 不变', () => {
    const oldContent = [P('ab'), P('Hello')]
    const newContent = [P('ab'), P('He', 'llo')]
    const sel: [any, any] = [
      { paragraphIndex: 1, fragmentIndex: 0, charIndex: 3 },
      { paragraphIndex: 1, fragmentIndex: 0, charIndex: 5 },
    ]
    const [start, end] = remapTextSelection(oldContent, newContent, sel)
    expect(start).toMatchObject({ paragraphIndex: 1, fragmentIndex: 1, charIndex: 1 })
    expect(end).toMatchObject({ paragraphIndex: 1, fragmentIndex: 1, charIndex: 3 })
  })
})
