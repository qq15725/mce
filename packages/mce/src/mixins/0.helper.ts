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

  Object.assign(editor, {
    parseAnchor,
  })
})
