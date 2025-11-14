import type { Element2D, Node, Vector2Data } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type { AxisAlignedBoundingBox } from '../types'
import { defineMixin } from '../editor'
import { isOverlappingObb } from '../utils'

declare global {
  namespace Mce {
    type AddElementPosition
      = | Vector2Data
        | Anchor
        | 'screenCenter'
        | 'pointer'

    interface AddElementOptions {
      position?: AddElementPosition
      parent?: Node
      index?: number
      sizeToFit?: boolean
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
    getObb,
    config,
    getAncestorFrame,
    getAabb,
    getGlobalPointer,
    screenCenter,
    selection,
    camera,
    parseAnchor,
  } = editor

  function addElement(
    value: Element | Element[],
    options: Mce.AddElementOptions = {},
  ): Element2D | Element2D[] {
    log('addElement', value, options)

    const {
      frameGap,
    } = config.value

    let {
      parent,
      index,
      sizeToFit,
      position,
      active,
      regenId,
    } = options

    if (!parent) {
      if (config.value.viewMode === 'frame') {
        parent = currentFrame.value
      }
      else {
        const node = selection.value[0]
        if (node) {
          if (isFrame(node)) {
            parent = node
          }
          else {
            parent = getAncestorFrame(node)
          }
        }
      }
    }
    const parentAabb = parent ? getAabb(parent) : undefined

    const isArray = Array.isArray(value)
    let offsetIndex = index

    const elements = doc.value.transact(() => {
      const values = isArray ? value : [value]
      const elements = values.map((element) => {
        const el = doc.value.addElement(element, {
          parentId: parent?.id,
          index: offsetIndex,
          regenId,
        }) as Element2D

        if (offsetIndex !== undefined) {
          offsetIndex++
        }

        if (el.text.isValid()) {
          if (!el.style.width)
            el.style.width = el.text.base.boundingBox.width
          if (!el.style.height)
            el.style.height = el.text.base.boundingBox.height
        }

        if (parentAabb && parentAabb.width && parentAabb.height) {
          const { width, height } = parentAabb
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
        }

        return el
      })

      const aabb = getAabb(elements)
      let globalPosition: { x: number, y: number } | undefined

      if (typeof position === 'string') {
        switch (position) {
          case 'pointer':
            break
          case 'screenCenter':
            globalPosition = camera.value.toGlobal(screenCenter.value)
            globalPosition.x -= aabb.width / 2
            globalPosition.y -= aabb.height / 2
            break
          default: {
            const _parentAabb = parentAabb ?? rootAabb.value
            const anchor = parseAnchor(position)
            globalPosition = { x: 0, y: 0 }

            const map = {
              centerX: () => globalPosition!.x = _parentAabb.left + _parentAabb.width / 2,
              centerY: () => globalPosition!.y = _parentAabb.top + _parentAabb.height / 2,
            }

            if (anchor.side === 'center') {
              map.centerX()
              map.centerY()
            }
            else {
              if (anchor.side === 'left' || anchor.side === 'right') {
                switch (anchor.side) {
                  case 'left':
                    globalPosition.x = _parentAabb.left - (aabb.width + frameGap)
                    break
                  case 'right':
                    globalPosition.x = _parentAabb.left + _parentAabb.width + frameGap
                    break
                }
                switch (anchor.align) {
                  case 'top':
                    globalPosition.y = _parentAabb.top
                    break
                  case 'bottom':
                    globalPosition.y = _parentAabb.top + _parentAabb.height
                    break
                  case 'center':
                    map.centerY()
                    break
                }
              }
              else if (anchor.side === 'top' || anchor.side === 'bottom') {
                switch (anchor.side) {
                  case 'top':
                    globalPosition.y = _parentAabb.top - (aabb.height + frameGap)
                    break
                  case 'bottom':
                    globalPosition.y = _parentAabb.top + _parentAabb.height + frameGap
                    break
                }
                switch (anchor.align) {
                  case 'left':
                    globalPosition.x = _parentAabb.left
                    break
                  case 'right':
                    globalPosition.x = _parentAabb.left + _parentAabb.width
                    break
                  case 'center':
                    map.centerX()
                    break
                }
              }
            }
            break
          }
        }
      }

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
      else if (globalPosition) {
        elements.forEach((el) => {
          el.style.left = Math.round(
            parentAabb
              ? parentAabb.left - globalPosition.x
              : globalPosition.x,
          )
          el.style.top = Math.round(
            parentAabb
              ? parentAabb.top - globalPosition.y
              : globalPosition.y,
          )
          globalPosition.x += el.style.width + frameGap
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
    options.textFontSizeToFit && textFontSizeToFit(element, scaleX)
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
          && isOverlappingObb(areaInDrawboard, getObb(node, 'drawboard'))
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
    selectArea,
  })
})
