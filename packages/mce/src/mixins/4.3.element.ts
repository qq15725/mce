import type { Element2D, Vector2Like } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { Node } from 'modern-canvas'
import { reactive } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    type AddElementPosition
      = | Vector2Like
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
      addElement: (element: Element, options?: AddElementOptions) => Element2D
      addElements: (element: Element[], options?: AddElementOptions) => Element2D[]
      resizeElement: (
        element: Element2D,
        newWidth: number,
        newHeight: number,
        options?: ResizeElementOptions,
      ) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    rootAabb,
    isElement,
    config,
    getAabb,
    getGlobalPointer,
    screenCenter,
    selection,
    camera,
    parseAnchor,
    exec,
  } = editor

  function addElement(
    value: Element | Element[],
    options: Mce.AddElementOptions = {},
  ): Element2D | Element2D[] {
    const frameGap = config.value.canvas.frame.gap

    const {
      parent,
      index,
      sizeToFit,
      position,
      active,
      regenId,
    } = options

    const parentAabb = parent ? getAabb(parent) : undefined

    const isArray = Array.isArray(value)
    let offsetIndex = index

    const elements = root.value.transact(() => {
      const index = offsetIndex
      const values = isArray ? value : [value]
      const elements = values.map((data) => {
        let _parent
        if (parent && parent.id !== root.value.id) {
          _parent = parent
        }
        else {
          _parent = root.value
        }
        const value = {
          ...data,
          meta: {
            inCanvasIs: 'Element2D',
            ...(data?.meta ?? {}),
          },
        }
        if (regenId) {
          delete value.id
        }
        const el = reactive(Node.parse(value)) as Element2D
        if (index === undefined) {
          _parent.appendChild(el)
        }
        else {
          _parent.moveChild(el, index)
        }

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
              newWidth,
              newHeight,
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
      else if (position) {
        globalPosition = { x: position.x, y: position.y }
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
          el.style.left += Math.round(
            parentAabb
              ? parentAabb.left - globalPosition.x
              : globalPosition.x,
          )
          el.style.top += Math.round(
            parentAabb
              ? parentAabb.top - globalPosition.y
              : globalPosition.y,
          )
        })
      }

      return elements
    })

    // TODO
    elements.forEach(el => el.updateGlobalTransform())

    if (active) {
      selection.value = elements
    }

    if (!isArray && !parent) {
      exec('nestIntoFrame', elements[0])
    }

    return isArray ? elements : elements[0]
  }

  function resizeElement(
    el: Element2D,
    newWidth: number,
    newHeight: number,
    options: Mce.ResizeElementOptions = {},
  ): void {
    const scaleX = Math.abs(newWidth / el.style.width)
    const scaleY = Math.abs(newHeight / el.style.height)

    function handle(el: Element2D, isChild = false) {
      const style = el.style
      if (isChild) {
        style.left *= scaleX
        style.top *= scaleY
      }
      style.width *= scaleX
      style.height *= scaleY
      el?.requestRender?.() // TODO
    }

    handle(el)

    if (options.deep) {
      el.findOne((node) => {
        if (isElement(node)) {
          handle(node, true)
        }
        return false
      })
    }

    options.textToFit && exec('textToFit', el)
    options.textFontSizeToFit && exec('textFontSizeToFit', el, scaleX)
  }

  Object.assign(editor, {
    addElement,
    addElements: addElement,
    resizeElement,
  })
})
