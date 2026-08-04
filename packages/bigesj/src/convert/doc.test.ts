import { describe, expect, it } from 'vitest'
import { convertDoc } from './doc'

/** 老作品最小结构：只有画板尺寸/位置，不含元素。 */
function docOf(layouts: { left: number, top: number, width: number, height: number }[]): Record<string, any> {
  return {
    content: {
      version: 1,
      layouts: layouts.map(l => ({
        style: { ...l, opacity: 1, position: 'absolute' },
        elements: [],
      })),
    },
  }
}

function boxesOf(doc: any): string[] {
  return [...doc.children]
    .sort((a: any, b: any) => a.name.localeCompare(b.name))
    .map((c: any) => `${c.name}:${c.style.left ?? 0},${c.style.top ?? 0}`)
}

describe('convertDoc 画板排布', () => {
  it('layout 自带互不相同的位置（公众号双封面）→ 原样保留，画板并排', async () => {
    // 头图1 900×383 在 (0,0)，头图2 500×500 在 (940,0)，中间 40px
    const doc = await convertDoc(docOf([
      { left: 0, top: 0, width: 900, height: 383 },
      { left: 940, top: 0, width: 500, height: 500 },
    ]))
    expect(boxesOf(doc)).toEqual(['画板 1:0,0', '画板 2:940,0'])
  })

  it('layout 位置全相同（普通多页作品都是 0,0）→ 按顺序纵向堆叠开', async () => {
    const doc = await convertDoc(docOf([
      { left: 0, top: 0, width: 1242, height: 1660 },
      { left: 0, top: 0, width: 1242, height: 1660 },
    ]), { gap: 40 })
    expect(boxesOf(doc)).toEqual(['画板 1:0,0', '画板 2:0,1700'])
  })
})
