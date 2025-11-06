import type { Element2D, Vector2Data } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type { AxisAlignedBoundingBox } from '../types'
import { defineMixin } from '../editor'
import { isOverlappingObb } from '../utils'

declare global {
  namespace Mce {
    interface AddElementOptions {
      frame?: Element2D
      sizeToFit?: boolean
      position?: Vector2Data | 'fit' | 'screenCenter' | 'pointer'
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
      pointerActivateElement: (
        element: Element2D | undefined,
        event?: MouseEvent | PointerEvent,
      ) => void
      selectArea: (areaInDrawboard: AxisAlignedBoundingBox) => Element2D[]
    }

    interface Events {
      addElement: [element: Element2D[]]
    }
  }
}

export default defineMixin((editor) => {
  const {
    doc,
    rootAabb,
    currentFrame,
    emit,
    textFontSizeToFit,
    textToFit,
    log,
    root,
    isFrame,
    isLock,
    getObbInDrawboard,
    config,
    getAncestorFrame,
    getAabb,
    getGlobalPointer,
    selection,
    getScreenCenterOffset,
    camera,
    drawboardAabb,
  } = editor

  function addElement(
    value: Element | Element[],
    options: Mce.AddElementOptions = {},
  ): Element2D | Element2D[] {
    log('addElement', value, options)

    let {
      frame,
      sizeToFit,
      position,
      active,
      regenId,
    } = options

    if (!frame) {
      if (config.value.viewMode === 'frame') {
        frame = currentFrame.value
      }
      else {
        const element = selection.value[0]
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

    let initPos: { x: number, y: number } | undefined
    switch (position) {
      case 'screenCenter': {
        const screenCenterOffset = getScreenCenterOffset()
        const { zoom, position } = camera.value
        const centerOffset = {
          x: position.x
            + screenCenterOffset.left
            + (
              (drawboardAabb.value.width - screenCenterOffset.left - screenCenterOffset.right) / 2
            ),
          y: position.y
            + screenCenterOffset.top
            + (
              (drawboardAabb.value.height - screenCenterOffset.top - screenCenterOffset.bottom) / 2
            ),
        }
        initPos = {
          x: centerOffset.x * zoom.x,
          y: centerOffset.y * zoom.y,
        }
        break
      }
      case 'fit':
        initPos = {
          x: rootAabb.value.left + rootAabb.value.width + config.value.frameGap,
          y: rootAabb.value.top,
        }
        break
      default:
        break
    }

    const isArray = Array.isArray(value)
    let offsetX = 0

    const elements = doc.value.transact(() => {
      const values = isArray ? value : [value]
      const elements = values.map((element) => {
        const el = doc.value.addElement(element, { parentId: frame?.id, regenId }) as Element2D

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
          if (position === 'fit') {
            el.style.left = Math.round(width - el.style.width) / 2
            el.style.top = Math.round(height - el.style.height) / 2
          }
        }
        else {
          if (initPos) {
            el.style.top = Math.round(initPos.x)
            el.style.left = Math.round(initPos.y)
            initPos.x += el.style.height + config.value.frameGap
          }
        }

        el.style.left += offsetX
        offsetX += el.style.width

        return el
      })

      const aabb = getAabb(elements)

      if (position === 'pointer') {
        const pointer = getGlobalPointer()
        const diff = {
          x: Math.round(pointer.x - aabb.left),
          y: Math.round(pointer.y - aabb.top),
        }
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
      selection.value = elements
    }

    emit('addElement', elements)

    return isArray ? elements : elements[0]
  }

  function deleteElement(id: string): void {
    if (id === selection.value[0]?.id) {
      selection.value = []
    }
    doc.value.deleteElement(id)
  }

  function updateElement(id: string, properties: Record<string, any>): void {
    getElement(id)?.setProperties(properties)
  }

  function getElement(id: string): Element2D | undefined {
    return doc.value.nodeMap.get(id) as Element2D | undefined
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
      style.left = Math.round(style.left * scaleX)
      style.top = Math.round(style.top * scaleY)
      style.width = Math.round(style.width * scaleX)
      style.height = Math.round(style.height * scaleY)
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

  function pointerActivateElement(
    element: Element2D | undefined,
    event?: MouseEvent | PointerEvent,
  ): void {
    if (element && (event?.ctrlKey || event?.shiftKey || event?.metaKey)) {
      let elements
      if (selection.value.length === 1) {
        elements = [selection.value[0], element]
      }
      else {
        if (selection.value.findIndex(v => v.equal(element)) > -1) {
          elements = selection.value.filter(v => v.equal(element))
        }
        else {
          elements = [...selection.value, element]
        }
      }
      selection.value = elements
    }
    else {
      selection.value = element ? [element] : []
    }
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
          && !isLock(node)
      }) ?? []
    selection.value = selected
    return selected
  }

  Object.assign(editor, {
    addElement,
    deleteElement,
    updateElement,
    getElement,
    resizeElement,
    pointerActivateElement,
    selectArea,
  })
})
