import type { NormalizedTextContent } from 'modern-idoc'
import { normalizeCRLF } from 'modern-idoc'

/**
 * 文本选区指针在内容结构里的逻辑定位（段 / 片段 / 段内字符）。
 * 与 web-components 的 IndexCharacter 兼容，但只取逻辑字段以保持纯函数无渲染耦合。
 */
export interface TextPointer {
  paragraphIndex: number
  fragmentIndex: number
  charIndex: number
}

/** 片段字符数（与 handleTextSelection 同口径：用 normalizeCRLF 计数）。 */
function fragmentCharLength(content: string): number {
  return Array.from(normalizeCRLF(content)).length
}

/** 指针在其所属段落内的绝对字符偏移。 */
export function paragraphCharOffset(content: NormalizedTextContent, p: TextPointer): number {
  const paragraph = content[p.paragraphIndex]
  if (!paragraph) {
    return p.charIndex
  }
  let offset = 0
  const n = Math.min(p.fragmentIndex, paragraph.fragments.length)
  for (let f = 0; f < n; f++) {
    offset += fragmentCharLength(paragraph.fragments[f].content)
  }
  return offset + p.charIndex
}

/** 把段内绝对偏移映射回某结构下的 (fragmentIndex, charIndex)。 */
export function offsetToPointer(
  content: NormalizedTextContent,
  paragraphIndex: number,
  offset: number,
): { fragmentIndex: number, charIndex: number } {
  const paragraph = content[paragraphIndex]
  if (!paragraph || paragraph.fragments.length === 0) {
    return { fragmentIndex: 0, charIndex: offset }
  }
  let remaining = offset
  for (let f = 0; f < paragraph.fragments.length; f++) {
    const len = fragmentCharLength(paragraph.fragments[f].content)
    // 落在本片段内；末片段兜底吸收溢出（选区端点可指向最后一个字符之后）。
    if (remaining < len || f === paragraph.fragments.length - 1) {
      return { fragmentIndex: f, charIndex: remaining }
    }
    remaining -= len
  }
  return { fragmentIndex: 0, charIndex: 0 }
}

/**
 * 设置样式时片段会按相同样式重新分组（字符与字形位置不变，仅 fragment 边界变化），
 * 旧选区指针的 fragmentIndex 因此失效。此函数按「段内绝对字符偏移」把一对指针重映射到
 * 新片段结构，保留指针的其余字段（含渲染坐标——它们仍然有效，因为字形位置未变）。
 */
export function remapTextSelection<T extends TextPointer>(
  oldContent: NormalizedTextContent,
  newContent: NormalizedTextContent,
  selection: [T, T],
): [T, T] {
  return selection.map((pointer) => {
    const offset = paragraphCharOffset(oldContent, pointer)
    const { fragmentIndex, charIndex } = offsetToPointer(newContent, pointer.paragraphIndex, offset)
    return { ...pointer, fragmentIndex, charIndex }
  }) as [T, T]
}
