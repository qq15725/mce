import type { Element2D, Node } from 'modern-canvas'
import type { ComputedRef } from 'vue'
import { Aabb2D, Obb2D, Transform2D } from 'modern-canvas'
import { computed } from 'vue'
import { defineMixin } from '../mixin'
import { noop } from '../utils'

declare global {
  namespace Mce {
    interface Editor {
      obbToFit: (element: Element2D) => void
      getObb: (node: Node | Node[] | undefined, inTarget?: 'drawboard' | 'frame' | 'parent') => Obb2D
      obbToDrawboardObb: (aabb: Obb2D) => Obb2D
      getAabb: (node: Node | Node[] | undefined, inTarget?: 'drawboard' | 'frame' | 'parent') => Aabb2D
      aabbToDrawboardAabb: (aabb: Aabb2D) => Aabb2D
      viewportAabb: ComputedRef<Aabb2D>
      rootAabb: ComputedRef<Aabb2D>
      selectionAabb: ComputedRef<Aabb2D>
      selectionAabbInDrawboard: ComputedRef<Aabb2D>
      selectionObb: ComputedRef<Obb2D>
      selectionObbInDrawboard: ComputedRef<Aabb2D>
      isPointerInSelection: ComputedRef<boolean>
    }
  }
}

export default defineMixin((editor) => {
  const {
    isElement,
    camera,
    root,
    selection,
    getAncestorFrame,
    drawboardAabb,
    screenControlsOffset,
    getGlobalPointer,
  } = editor

  function obbToFit(element: Element2D): void {
    const min = {
      x: Number.MAX_SAFE_INTEGER,
      y: Number.MAX_SAFE_INTEGER,
    }
    const max = {
      x: Number.MIN_SAFE_INTEGER,
      y: Number.MIN_SAFE_INTEGER,
    }
    let flag = false
    element.children.forEach((child) => {
      if (isElement(child)) {
        const { min: _min, max: _max } = child.aabb
        min.x = Math.min(min.x, _min.x)
        min.y = Math.min(min.y, _min.y)
        max.x = Math.max(max.x, _max.x)
        max.y = Math.max(max.y, _max.y)
        flag = true
      }
    })
    if (flag) {
      const box = {
        left: min.x,
        top: min.y,
        width: max.x - min.x,
        height: max.y - min.y,
      }

      const aabbs: Record<number, any> = {}
      element.children.forEach((child, index) => {
        if (isElement(child)) {
          aabbs[index] = child.globalAabb
        }
      })

      element.style.left += box.left
      element.style.top += box.top
      element.style.width = box.width
      element.style.height = box.height
      element.updateGlobalTransform()

      element.children.forEach((child, index) => {
        if (isElement(child)) {
          child.updateGlobalTransform()
          const oldAabb = aabbs[index]
          const localCenter = child.toLocal({
            x: oldAabb.left + oldAabb.width / 2,
            y: oldAabb.top + oldAabb.height / 2,
          })
          const pivot = child.pivot
          const style = child.style
          const offset = [
            localCenter.x - pivot.x,
            localCenter.y - pivot.y,
          ]

          const transform = new Transform2D()
            .scale(child.scale.x, child.scale.y)
            .skew(child.skew.x, child.skew.y)
            .rotate(child.rotation)

          const _offset = transform.apply({ x: offset[0], y: offset[1] })
          style.left += _offset.x
          style.top += _offset.y
          child.updateGlobalTransform()
        }
      })
    }
  }

  function getObb(
    node: Node | Node[] | undefined,
    inTarget?: 'drawboard' | 'frame' | 'parent',
  ): Obb2D {
    let obb
    if (Array.isArray(node) && node.length > 0) {
      if (node.length === 1) {
        obb = getObb(node[0])
      }
      else {
        obb = new Obb2D(getAabb(node))
      }
    }
    else if (isElement(node)) {
      // for vue reactive
      const style = node.style
      noop(style.left, style.top, style.width, style.height, style.rotate)
      obb = node.getGlobalObb()
    }
    else {
      obb = new Obb2D()
    }
    if (inTarget === 'drawboard') {
      obb = obbToDrawboardObb(obb)
    }
    else if (inTarget === 'frame') {
      const first = Array.isArray(node) ? node[0] : node
      if (isElement(first)) {
        const frame = getAncestorFrame(first)
        if (frame) {
          obb.left -= frame.style.left
          obb.top -= frame.style.top
        }
      }
    }
    else if (inTarget === 'parent') {
      const first = Array.isArray(node) ? node[0] : node
      if (isElement(first)) {
        const parent = first.findAncestor(el => isElement(el))
        if (parent) {
          const parentBox = getAabb(parent)
          obb.left -= parentBox.left
          obb.top -= parentBox.top
        }
      }
    }
    return obb
  }

  function getAabb(
    node: Node | Node[] | undefined,
    inTarget?: 'drawboard' | 'frame' | 'parent',
  ): Aabb2D {
    let aabb: Aabb2D
    if (Array.isArray(node) && node.length > 0) {
      if (node.length === 1) {
        aabb = getAabb(node[0])
      }
      else {
        const min = {
          x: Number.MAX_SAFE_INTEGER,
          y: Number.MAX_SAFE_INTEGER,
        }
        const max = {
          x: Number.MIN_SAFE_INTEGER,
          y: Number.MIN_SAFE_INTEGER,
        }
        node.forEach((child) => {
          if (isElement(child)) {
            const aabb = getAabb(child)
            min.x = Math.min(min.x, aabb.left)
            min.y = Math.min(min.y, aabb.top)
            max.x = Math.max(max.x, aabb.left + aabb.width)
            max.y = Math.max(max.y, aabb.top + aabb.height)
          }
        })
        aabb = new Aabb2D(
          min.x,
          min.y,
          max.x - min.x,
          max.y - min.y,
        )
      }
    }
    else if (isElement(node)) {
      // for vue reactive
      const style = node.style
      noop([style.left, style.top, style.width, style.height, style.rotate])
      aabb = node.globalAabb
    }
    else {
      aabb = new Aabb2D()
    }
    if (inTarget === 'drawboard') {
      aabb = aabbToDrawboardAabb(aabb)
    }
    else if (inTarget === 'frame') {
      const first = Array.isArray(node) ? node[0] : node
      if (isElement(first)) {
        const frame = getAncestorFrame(first)
        if (frame) {
          aabb.left -= frame.style.left
          aabb.top -= frame.style.top
        }
      }
    }
    else if (inTarget === 'parent') {
      const first = Array.isArray(node) ? node[0] : node
      if (isElement(first)) {
        const parent = first.findAncestor(el => isElement(el))
        if (parent) {
          const parentBox = getAabb(parent)
          aabb.left -= parentBox.left
          aabb.top -= parentBox.top
        }
      }
    }
    return aabb
  }

  function aabbToDrawboardAabb(aabb: Aabb2D): Aabb2D {
    const _aabb = new Aabb2D(aabb)
    const zoom = camera.value.zoom
    const position = camera.value.position
    _aabb.left *= zoom.x
    _aabb.top *= zoom.y
    _aabb.width *= zoom.x
    _aabb.height *= zoom.y
    _aabb.left -= position.x
    _aabb.top -= position.y
    return _aabb
  }

  function obbToDrawboardObb(obb: Obb2D): Obb2D {
    const _obb = new Obb2D(obb)
    const zoom = camera.value.zoom
    const position = camera.value.position
    _obb.left *= zoom.x
    _obb.top *= zoom.y
    _obb.width *= zoom.x
    _obb.height *= zoom.y
    _obb.left -= position.x
    _obb.top -= position.y
    return _obb
  }

  const viewportAabb = computed(() => {
    const _camera = camera.value
    const { position, zoom } = _camera
    // for vue reactive
    noop(
      position.x,
      position.y,
      zoom.x,
      zoom.y,
    )
    const { left, top, right, bottom } = screenControlsOffset.value
    const { width, height } = drawboardAabb.value
    const p1 = _camera.toGlobal({ x: left, y: top })
    const p2 = _camera.toGlobal({ x: width - (right + left), y: height - (bottom + top) })
    return new Aabb2D({
      x: p1.x,
      y: p1.y,
      width: p2.x - p1.x,
      height: p2.y - p1.y,
    })
  })
  const rootAabb = computed(() => getAabb(root.value.children))
  const selectionAabb = computed(() => getAabb(selection.value))
  const selectionAabbInDrawboard = computed(() => aabbToDrawboardAabb(selectionAabb.value))
  const selectionObb = computed(() => getObb(selection.value))
  const selectionObbInDrawboard = computed(() => obbToDrawboardObb(selectionObb.value))
  const isPointerInSelection = computed(() => selectionAabb.value.contains(getGlobalPointer()))

  Object.assign(editor, {
    obbToFit,
    getObb,
    obbToDrawboardObb,
    getAabb,
    aabbToDrawboardAabb,
    viewportAabb,
    rootAabb,
    selectionAabb,
    selectionAabbInDrawboard,
    selectionObb,
    selectionObbInDrawboard,
    isPointerInSelection,
  })
})
