import type { Node } from 'modern-canvas'
import { Element2D } from 'modern-canvas'
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
      isFrame: (node: Node) => node is Element2D
      isLocked: (element: Element2D) => boolean
      setLock: (element: Element2D, lock: boolean) => void
    }
  }
}

export default defineMixin((editor) => {
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

  function isFrame(node: Node): node is Element2D {
    return node instanceof Element2D
      && node.meta?.inEditorIs === 'Frame'
  }

  function isLocked(element: Element2D): boolean {
    return Boolean(element.meta.lock)
  }

  function setLock(element: Element2D, lock: boolean): void {
    element.meta.lock = lock
  }

  Object.assign(editor, {
    parseAnchor,
    isFrame,
    isLocked,
    setLock,
  })
})
