import type { Element2D } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      isLockedElement: (element: Element2D) => boolean
      lockElement: (element: Element2D) => void
      unlockElement: (element: Element2D) => void
      lockOrUnlockElement: (element: Element2D) => void
      lockCurrentElements: () => void
      unlockCurrentElements: () => void
      lockOrUnlockCurrentElements: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    currentElements,
  } = editor

  function isLockedElement(element: Element2D): boolean {
    return Boolean(element.meta.locked)
  }

  function lockElement(element: Element2D): void {
    element.meta.locked = true
  }

  function unlockElement(element: Element2D): void {
    element.meta.locked = false
  }

  function lockOrUnlockElement(element: Element2D): void {
    if (isLockedElement(element)) {
      unlockElement(element)
    }
    else {
      lockElement(element)
    }
  }

  function lockCurrentElements(): void {
    currentElements.value.forEach((element) => {
      lockElement(element)
    })
  }

  function unlockCurrentElements(): void {
    currentElements.value.forEach((element) => {
      unlockElement(element)
    })
  }

  function lockOrUnlockCurrentElements(): void {
    currentElements.value.forEach((element) => {
      lockOrUnlockElement(element)
    })
  }

  provideProperties({
    isLockedElement,
    lockElement,
    unlockElement,
    lockOrUnlockElement,
    lockCurrentElements,
    unlockCurrentElements,
    lockOrUnlockCurrentElements,
  })
})
