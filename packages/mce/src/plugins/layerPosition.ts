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
    isElement,
    rootAabb,
    elementSelection,
    getAabb,
  } = editor

  function align(direction: Mce.AlignCommandDirection) {
    elementSelection.value.forEach((el) => {
      if (el.parent && isElement(el.parent)) {
        const parentAabb = getAabb(el.parent)

        switch (direction) {
          case 'left':
            el.style.left = 0
            break
          case 'horizontal-center':
            el.style.left = (parentAabb.width - el.style.width) / 2
            break
          case 'right':
            el.style.left = parentAabb.width - el.style.width
            break
          case 'top':
            el.style.top = 0
            break
          case 'vertical-center':
            el.style.top = (parentAabb.height - el.style.height) / 2
            break
          case 'bottom':
            el.style.top = parentAabb.height - el.style.height
            break
        }
      }
      else {
        switch (direction) {
          case 'left':
            el.style.left = rootAabb.value.left
            break
          case 'horizontal-center':
            el.style.left = (rootAabb.value.left + rootAabb.value.width - el.style.width) / 2
            break
          case 'right':
            el.style.left = (rootAabb.value.left + rootAabb.value.width) - el.style.width
            break
          case 'top':
            el.style.top = rootAabb.value.top
            break
          case 'vertical-center':
            el.style.top = (rootAabb.value.top + rootAabb.value.height - el.style.height) / 2
            break
          case 'bottom':
            el.style.top = (rootAabb.value.top + rootAabb.value.height) - el.style.height
            break
        }
      }
    })
  }

  return {
    name: 'mce:layerPosition',
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
