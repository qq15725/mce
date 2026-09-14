import { describe, expect, it } from 'vitest'
import { getTextContents } from './text'

function content(fragments: string[], version?: number): string {
  const paragraphs = getTextContents({ contents: [fragments.map(content => ({ content }))], version } as any)
  return paragraphs[0].map((fragment: { content: string }) => fragment.content).join('')
}

describe('旧模板空白转换', () => {
  it('保留 tid 991642 逐字保存的四个分隔空格', () => {
    expect(content(Array.from('以花为名    礼赞恩师'))).toBe('以花为名    礼赞恩师')
  })

  it('同一片段内仍按旧画布折叠空白', () => {
    expect(content(['以花为名    礼赞恩师'])).toBe('以花为名 礼赞恩师')
  })

  it('去除用于恢复首行缩进的前导空白', () => {
    expect(content([' ', ' ', '  ', '正文'])).toBe('正文')
  })

  it('新版模板原样保留空白', () => {
    expect(content(['  正文    内容'], 2)).toBe('  正文    内容')
  })
})
