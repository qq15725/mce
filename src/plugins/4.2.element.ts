import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type { AxisAlignedBoundingBox } from '../types'
import { normalizeElement } from 'modern-idoc'
import { definePlugin } from '../editor'
import { isOverlappingObb } from '../utils'

declare global {
  namespace Mce {
    interface AddElementOptions {
      positionToFit?: boolean
      sizeToFit?: boolean
      frame?: Element2D
    }

    interface ResizeElementOptions {
      deep?: boolean
      textToFit?: boolean
      textFontSizeToFit?: boolean
    }

    interface Editor {
      addElement: {
        (element: Element, options?: AddElementOptions): Element2D
        (element: Element[], options?: AddElementOptions): Element2D[]
      }
      deleteElement: (id: string) => void
      updateElement: (id: string, properties: Record<string, any>) => void
      getElement: (id: string) => Element2D | undefined
      resizeElement: (
        element: Element2D,
        width: number,
        height: number,
        options?: ResizeElementOptions,
      ) => void
      getActiveElement: () => Element2D | undefined
      setActiveElement: (id: string | Element2D | undefined) => void
      pointerActivateElement: (
        element: Element2D | undefined,
        event?: MouseEvent | PointerEvent,
      ) => void
      deleteCurrentElements: () => void
      setSelectedElements: (elements: Element2D[]) => void
      selectArea: (areaInDrawboard: AxisAlignedBoundingBox) => Element2D[]
    }

    interface Events {
      addElement: [element: Element2D[]]
      setActiveElement: [element?: Element2D]
      setSelectedElements: [elements: Element2D[]]
    }

    interface Hotkeys {
      delete: [event: KeyboardEvent]
    }

    interface Commands {
      delete: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerHotkey,
    registerCommand,
    doc,
    rootAabb,
    activeFrame,
    activeElement,
    selectedElements,
    hoverElement,
    emit,
    textFontSizeToFit,
    textToFit,
    log,
    root,
    isFrame,
    isLocked,
    getObbInDrawboard,
    config,
    getAncestorFrame,
    currentElements,
  } = editor

  registerCommand([
    { key: 'delete', handle: deleteCurrentElements },
  ])

  const condition = (): boolean => Boolean(!!activeElement.value || selectedElements.value.length)

  registerHotkey([
    { key: 'delete', accelerator: ['Backspace', 'Delete'], condition },
  ])

  function addElement(
    value: Element | Element[],
    options: Mce.AddElementOptions = {},
  ): Element2D | Element2D[] {
    const isArray = Array.isArray(value)

    log('addElement', value, options)

    let { frame } = options
    if (!frame) {
      if (config.value.viewMode === 'frame') {
        frame = activeFrame.value
      }
      else {
        const element = currentElements.value[0]
        if (element) {
          if (isFrame(element)) {
            frame = element
          }
          else {
            frame = getAncestorFrame(element)
          }
        }
      }
    }

    let top = rootAabb.value.top
    const left = rootAabb.value.left + rootAabb.value.width + config.value.frameGap

    const elements = doc.value!.transact(() => {
      const values = isArray ? value : [value]
      return values.map((_element) => {
        const element = normalizeElement(_element)

        const el = doc.value!.addElement(element, {
          parentId: frame?.id,
        }) as Element2D

        if (frame) {
          const { width, height } = frame.style
          const halfWidth = width / 2
          const halfHeight = height / 2
          if (!el.style.width)
            el.style.width = halfWidth
          if (!el.style.height)
            el.style.height = halfHeight
          if (options.sizeToFit) {
            const aspectRatio = el.style.width / el.style.height
            const newWidth = aspectRatio > 1 ? halfWidth : halfHeight * aspectRatio
            const newHeight = aspectRatio > 1 ? halfWidth / aspectRatio : halfHeight
            resizeElement(el, newWidth, newHeight, {
              deep: true,
              textFontSizeToFit: true,
            })
          }
          if (options.positionToFit) {
            el.style.left = (width - el.style.width) / 2
            el.style.top = (height - el.style.height) / 2
          }
        }
        else {
          if (options.positionToFit) {
            el.style.top = top
            el.style.left = left
            top += el.style.height + config.value.frameGap
          }
        }

        return el
      })
    })
    // TODO
    elements.forEach(el => el.updateGlobalTransform())
    emit('addElement', elements)
    return isArray ? elements : elements[0]
  }

  function deleteElement(id: string): void {
    if (id === activeElement.value?.id) {
      setActiveElement(undefined)
    }
    doc.value?.deleteElement(id)
  }

  function updateElement(id: string, properties: Record<string, any>): void {
    getElement(id)?.setProperties(properties)
  }

  function getElement(id: string): Element2D | undefined {
    return doc.value?.nodeMap?.get(id) as Element2D | undefined
  }

  function resizeElement(
    element: Element2D,
    width: number,
    height: number,
    options: Mce.ResizeElementOptions = {},
  ): void {
    const scale = {
      x: width / (element.style.width ?? 0),
      y: height / (element.style.height ?? 0),
    }

    function handle(element: Element2D) {
      const style = element.style
      style.left *= scale.x
      style.top *= scale.y
      style.width *= scale.x
      style.height *= scale.y
      element?.requestRedraw?.() // TODO
    }

    handle(element)

    function deepHandle(element: Element2D): void {
      handle(element)
      element.children?.forEach((child) => {
        deepHandle(child as any)
      })
    }

    options.deep && deepHandle(element)
    options.textToFit && textToFit(element)
    options.textFontSizeToFit && textFontSizeToFit(element)
  }

  function getActiveElement(): Element2D | undefined {
    return activeElement.value
  }

  function setActiveElement(id: string | Element2D | undefined): void {
    let element
    if (typeof id === 'string') {
      element = getElement(id)
    }
    else {
      element = id
    }
    const unequal = activeElement.value
      ? !activeElement.value.equal(element)
      : activeElement.value !== element
    activeElement.value = element
    if (element) {
      setSelectedElements([])
    }
    if (unequal) {
      emit('setActiveElement', element)
    }
  }

  function pointerActivateElement(
    element: Element2D | undefined,
    event?: MouseEvent | PointerEvent,
  ): void {
    if (element && (event?.ctrlKey || event?.shiftKey || event?.metaKey)) {
      let elements
      if (activeElement.value) {
        elements = [activeElement.value, element]
        setActiveElement(undefined)
      }
      else {
        if (selectedElements.value.findIndex(v => v.equal(element)) > -1) {
          elements = selectedElements.value.filter(v => v.equal(element))
        }
        else {
          elements = [...selectedElements.value, element]
        }
      }
      setSelectedElements(elements)
    }
    else {
      setSelectedElements([])
      setActiveElement(element)
    }
  }

  function deleteCurrentElements(): void {
    if (selectedElements.value.length) {
      selectedElements.value.forEach((element: Element2D) => {
        deleteElement(element.id)
      })
      setSelectedElements([])
    }
    else if (activeElement.value) {
      deleteElement(activeElement.value.id)
    }
    hoverElement.value = undefined
  }

  function setSelectedElements(elements: Element2D[]): void {
    if (!elements.length && !selectedElements.value.length) {
      return
    }
    selectedElements.value = elements
    if (elements.length) {
      setActiveElement(undefined)
    }
    emit('setSelectedElements', elements)
  }

  function selectArea(areaInDrawboard: AxisAlignedBoundingBox): Element2D[] {
    const selected = root.value
      ?.children
      .flatMap((node) => {
        if (isFrame(node)) {
          return node.children as unknown as Element2D[]
        }
        return [node] as Element2D[]
      })
      .filter((node) => {
        return 'isVisibleInTree' in node
          && node.isVisibleInTree()
          && isOverlappingObb(areaInDrawboard, getObbInDrawboard(node))
          && !isLocked(node)
      }) ?? []
    setSelectedElements(selected)
    return selected
  }

  Object.assign(editor, {
    addElement,
    deleteElement,
    updateElement,
    getElement,
    resizeElement,
    getActiveElement,
    setActiveElement,
    pointerActivateElement,
    deleteCurrentElements,
    setSelectedElements,
    selectArea,
  })
})
