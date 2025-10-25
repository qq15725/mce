import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    type AlignCommandDirection
      = | 'left'
        | 'horizontal-center'
        | 'right'
        | 'top'
        | 'vertical-center'
        | 'bottom'

    interface Commands {
      align: (direction: AlignCommandDirection) => void
      alignLeft: () => void
      alignHorizontalCenter: () => void
      alignRight: () => void
      alignTop: () => void
      alignVerticalCenter: () => void
      alignBottom: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    activeFrameAabb,
    selection,
    getAabb,
  } = editor

  function align(direction: Mce.AlignCommandDirection) {
    const box = selection.value.length === 1
      ? activeFrameAabb.value
      : getAabb(selection.value)

    selection.value.forEach((el) => {
      switch (direction) {
        case 'left':
          el.style.left = 0
          break
        case 'horizontal-center':
          el.style.left = (box.width - el.style.width) / 2
          break
        case 'right':
          el.style.left = box.width - el.style.width
          break
        case 'top':
          el.style.top = 0
          break
        case 'vertical-center':
          el.style.top = (box.height - el.style.height) / 2
          break
        case 'bottom':
          el.style.top = box.height - el.style.height
          break
      }
    })
  }

  return {
    name: 'layerPosition',
    commands: [
      { command: 'align', handle: align },
      { command: 'alignLeft', handle: () => align('left') },
      { command: 'alignHorizontalCenter', handle: () => align('horizontal-center') },
      { command: 'alignRight', handle: () => align('right') },
      { command: 'alignTop', handle: () => align('top') },
      { command: 'alignVerticalCenter', handle: () => align('vertical-center') },
      { command: 'alignBottom', handle: () => align('bottom') },
    ],
    hotkeys: [
      { command: 'alignLeft', key: 'Alt+a' },
      { command: 'alignHorizontalCenter', key: 'Alt+h' },
      { command: 'alignRight', key: 'Alt+d' },
      { command: 'alignTop', key: 'Alt+w' },
      { command: 'alignVerticalCenter', key: 'Alt+v' },
      { command: 'alignBottom', key: 'Alt+s' },
    ],
  }
})
