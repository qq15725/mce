import type { Element2D, Vector2Like } from 'modern-canvas'
import { ref } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface HandleDragOutReparentOptions {
      pointer: Vector2Like
      parent: Element2D
      index: number
    }

    interface Editor {
      findFrame: (target: 'next' | 'previous') => Element2D | undefined
      handleDragOutReparent: (element: Element2D, context?: HandleDragOutReparentOptions) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    frames,
    isTopFrame,
    exec,
    selection,
    getAncestorFrame,
  } = editor

  function findFrame(target: 'next' | 'previous'): Element2D | undefined {
    let current: Element2D | undefined
    const node = selection.value[0]
    if (node) {
      current = isTopFrame(node)
        ? node
        : getAncestorFrame(node, true)
    }
    const last = frames.value.length - 1
    let index = frames.value.findIndex(node => node.equal(current))
    switch (target) {
      case 'next':
        index--
        if (index < 0) {
          index = last
        }
        break
      case 'previous':
        index++
        if (index > last) {
          index = 0
        }
        break
    }
    return frames.value[index]
  }

  function handleDragOutReparent(
    element: Element2D,
    options?: Mce.HandleDragOutReparentOptions,
  ): void {
    const pointer = options?.pointer as any
    const frame1 = element.findAncestor(node => isTopFrame(node))
    const aabb1 = element.getGlobalAabb()
    const area1 = aabb1.getArea()
    let flag = true
    for (let i = 0, len = frames.value.length; i < len; i++) {
      const frame2 = frames.value[i]
      if (frame2.equal(element)) {
        continue
      }
      const aabb2 = frame2.getGlobalAabb()
      if (aabb2) {
        if (
          pointer
            ? aabb2.contains(pointer)
            : (aabb1 && aabb1.getIntersectionRect(aabb2).getArea() > area1 * 0.5)
        ) {
          if (!frame2.equal(frame1)) {
            let index = frame2.children.length
            if (frame2.equal(options?.parent)) {
              index = options!.index
            }
            frame2.moveChild(element, index)
            element.style.left = aabb1.x - aabb2.x
            element.style.top = aabb1.y - aabb2.y
            element.updateGlobalTransform()
            exec('layerScrollIntoView')
          }
          flag = false
          break
        }
      }
    }

    if (
      flag
      && frame1
    ) {
      let index = root.value.children.length
      if (root.value.equal(options?.parent)) {
        index = options!.index
      }
      root.value.moveChild(element, index)
      element.style.left = aabb1.x
      element.style.top = aabb1.y
      element.updateGlobalTransform()
      exec('layerScrollIntoView')
    }
  }

  Object.assign(editor, {
    findFrame,
    handleDragOutReparent,
  })

  return () => {
    const {
      on,
      getGlobalPointer,
    } = editor

    const startContext = ref<Record<string, Record<string, any>>>({})

    on('selectionTransformStart', ({ elements }) => {
      const ctx: Record<string, Record<string, any>> = {}
      elements.forEach((el) => {
        ctx[el.instanceId] = {
          parent: el.getParent(),
          index: el.getIndex(),
        }
      })
      startContext.value = ctx
    })

    on('selectionTransforming', ({ handle, startEvent, elements }) => {
      // move to frame
      if (handle === 'move' && !(startEvent as any)?.__FORM__) {
        elements.forEach((element) => {
          handleDragOutReparent(
            element,
            {
              ...startContext.value[element.instanceId],
              pointer: getGlobalPointer(),
            } as any,
          )
        })
      }
    })

    on('selectionTransformEnd', () => {
      startContext.value = {}
    })
  }
})
