import { Element2D, Node } from 'modern-canvas'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type Tblock = 'top' | 'bottom'

    type Tinline = 'start' | 'end' | 'left' | 'right'

    type Anchor
      = | Tblock
        | Tinline
        | 'center'
        | 'center center'
        | `${Tblock} ${Tinline | 'center'}`
        | `${Tinline} ${Tblock | 'center'}`

    type ParsedAnchor
      = | { side: 'center', align: 'center' }
        | { side: Tblock, align: 'left' | 'right' | 'center' }
        | { side: 'left' | 'right', align: Tblock | 'center' }

    interface Editor {
      parseAnchor: (anchor: Anchor, isRtl?: boolean) => ParsedAnchor
      isRoot: (value: any) => value is Node
      isElement: (value: any) => value is Element2D
      isFrame: (node: Node) => node is Element2D
      isVisible: (node: Node) => boolean
      setVisible: (node: Node, visible: boolean) => void
      isLock: (node: Node) => boolean
      setLock: (node: Node, lock: boolean) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
  } = editor

  const block = ['top', 'bottom']
  const inline = ['start', 'end', 'left', 'right']

  function toPhysical(str: 'center' | Mce.Tblock | Mce.Tinline, isRtl?: boolean): 'bottom' | 'center' | 'left' | 'right' | 'top' {
    if (str === 'start')
      return isRtl ? 'right' : 'left'
    if (str === 'end')
      return isRtl ? 'left' : 'right'
    return str
  }

  const parseAnchor: Mce.Editor['parseAnchor'] = (anchor, isRtl) => {
    let [side, align] = anchor.split(' ')
    if (!align) {
      align = block.includes(side)
        ? 'start'
        : inline.includes(side)
          ? 'top'
          : 'center'
    }
    return {
      side: toPhysical(side as any, isRtl),
      align: toPhysical(align as any, isRtl),
    } as Mce.ParsedAnchor
  }

  function isRoot(value: any): value is Node {
    return value instanceof Node && root.value.equal(value)
  }

  function isElement(value: any): value is Element2D {
    return value instanceof Element2D
  }

  function isFrame(node: Node): node is Element2D {
    return isElement(node) && node.meta.inEditorIs === 'Frame'
  }

  function isVisible(node: Node): boolean {
    return isElement(node) && node.style.visibility === 'visible'
  }

  function setVisible(node: Node, visible: boolean): void {
    if (isElement(node)) {
      node.style.visibility = visible ? 'visible' : 'hidden'
    }
  }

  function isLock(node: Node): boolean {
    return Boolean(node.meta.lock)
  }

  function setLock(node: Node, lock: boolean): void {
    node.meta.lock = lock
  }

  Object.assign(editor, {
    parseAnchor,
    isRoot,
    isElement,
    isFrame,
    isVisible,
    setVisible,
    isLock,
    setLock,
  })
})
