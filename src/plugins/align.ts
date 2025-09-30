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
    activeElement,
    activeFrameAabb,
    selectedElements,
    currentElements,
    getAabb,
    registerCommand,
  } = editor

  registerCommand([
    { key: 'align', handle: align },
    { key: 'alignLeft', handle: () => align('left') },
    { key: 'alignHorizontalCenter', handle: () => align('horizontal-center') },
    { key: 'alignRight', handle: () => align('right') },
    { key: 'alignTop', handle: () => align('top') },
    { key: 'alignVerticalCenter', handle: () => align('vertical-center') },
    { key: 'alignBottom', handle: () => align('bottom') },
  ])

  function align(direction: Mce.AlignCommandDirection) {
    const box = activeElement.value
      ? activeFrameAabb.value
      : getAabb(selectedElements.value)
    currentElements.value.forEach((el) => {
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
})
