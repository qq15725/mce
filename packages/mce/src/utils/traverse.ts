import type { Node } from 'modern-canvas'

/**
 * 深度遍历节点（含内部层），对每个节点执行 cb。
 *
 * 关键：用 `getChildren(true)` 而非 `children`。表格单元格等内容被放在 `back` 内部层、
 * 不进 `children` / `toJSON`，常规 `children` 遍历会漏。凡是「必须覆盖全部内容」的操作
 * （字体重排、导出、查找、序列化前处理）都应走这里，否则表格内容会被静默漏掉。
 */
export function eachElement(node: Node, cb: (node: Node) => void): void {
  cb(node)
  node.getChildren(true).forEach(child => eachElement(child, cb))
}
