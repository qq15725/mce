import type { Element2D, Vector2Data } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type { AxisAlignedBoundingBox } from '../types'
import { definePlugin } from '../editor'
import { isOverlappingObb } from '../utils'

declare global {
  namespace Mce {
    interface AddElementOptions {
      frame?: Element2D
      positionToFit?: boolean
      sizeToFit?: boolean
      position?: Vector2Data
      inPointerPosition?: boolean
      active?: boolean
      regenId?: boolean
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
    getAabb,
    getGlobalPointer,
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
    log('addElement', value, options)

    let {
      frame,
      positionToFit,
      sizeToFit,
      position,
      inPointerPosition,
      active,
      regenId,
    } = options

    if (!position && inPointerPosition) {
      position = getGlobalPointer()
    }

    if (position) {
      positionToFit = false
    }

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
    const isArray = Array.isArray(value)

    const elements = doc.value!.transact(() => {
      const values = isArray ? value : [value]
      const elements = values.map((element) => {
        const el = doc.value!.addElement(element, { parentId: frame?.id, regenId }) as Element2D

        if (frame) {
          const { width, height } = frame.style
          const halfWidth = width / 2
          const halfHeight = height / 2
          if (!el.style.width)
            el.style.width = halfWidth
          if (!el.style.height)
            el.style.height = halfHeight
          if (sizeToFit) {
            const aspectRatio = el.style.width / el.style.height
            const newWidth = aspectRatio > 1 ? halfWidth : halfHeight * aspectRatio
            const newHeight = aspectRatio > 1 ? halfWidth / aspectRatio : halfHeight
            resizeElement(
              el,
              newWidth / el.style.width,
              newHeight / el.style.height,
              {
                deep: true,
                textFontSizeToFit: true,
              },
            )
          }
          if (positionToFit) {
            el.style.left = (width - el.style.width) / 2
            el.style.top = (height - el.style.height) / 2
          }
        }
        else {
          if (positionToFit) {
            el.style.top = top
            el.style.left = left
            top += el.style.height + config.value.frameGap
          }
        }

        return el
      })

      const aabb = getAabb(elements)

      if (position) {
        const diff = { x: position.x - aabb.left, y: position.y - aabb.top }

        elements.forEach((el) => {
          el.style.left += diff.x
          el.style.top += diff.y
        })
      }

      return elements
    })

    // TODO
    elements.forEach(el => el.updateGlobalTransform())

    if (active) {
      if (isArray) {
        setSelectedElements(elements)
      }
      else {
        setActiveElement(elements[0])
      }
    }

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
    scaleX: number,
    scaleY: number,
    options: Mce.ResizeElementOptions = {},
  ): void {
    scaleX = Math.abs(scaleX)
    scaleY = Math.abs(scaleY)

    function handle(element: Element2D) {
      const style = element.style
      style.left *= scaleX
      style.top *= scaleY
      style.width *= scaleX
      style.height *= scaleY
      element?.requestRedraw?.() // TODO
    }

    handle(element)

    function deepHandle(element: Element2D): void {
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
