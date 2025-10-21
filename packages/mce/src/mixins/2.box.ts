import type { Node } from 'modern-canvas'
import type { ComputedRef } from 'vue'
import type { AxisAlignedBoundingBox, OrientedBoundingBox } from '../types'
import { DEG_TO_RAD, Element2D, Transform2D } from 'modern-canvas'
import { computed } from 'vue'
import { defineMixin } from '../editor'

function noop(..._args: any): void {}

declare global {
  namespace Mce {
    interface Editor {
      obbToFit: (element: Element2D) => void
      getObb: (node: Node | Node[] | undefined, inTarget?: 'drawboard' | 'frame') => OrientedBoundingBox
      getObbInDrawboard: (node?: Node | Node[]) => OrientedBoundingBox
      getAabb: (node: Node | Node[] | undefined, inTarget?: 'drawboard' | 'frame') => AxisAlignedBoundingBox
      getAabbInDrawboard: (node?: Node | Node[]) => AxisAlignedBoundingBox
      aabbToDrawboardAabb: (aabb: AxisAlignedBoundingBox) => AxisAlignedBoundingBox
      rootAabb: ComputedRef<AxisAlignedBoundingBox>
      currentAabb: ComputedRef<AxisAlignedBoundingBox>
    }
  }
}

export default defineMixin((editor) => {
  const {
    camera,
    root,
    selection,
    getAncestorFrame,
  } = editor

  function obbToFit(element: Element2D): void {
    const minmax = {
      minX: Number.MAX_SAFE_INTEGER,
      minY: Number.MAX_SAFE_INTEGER,
      maxX: Number.MIN_SAFE_INTEGER,
      maxY: Number.MIN_SAFE_INTEGER,
    }
    let flag = false
    element.children.forEach((child) => {
      if (child instanceof Element2D) {
        const _minmax = child.getAabb().toMinmax()
        minmax.minX = Math.min(minmax.minX, _minmax.minX)
        minmax.minY = Math.min(minmax.minY, _minmax.minY)
        minmax.maxX = Math.max(minmax.maxX, _minmax.maxX)
        minmax.maxY = Math.max(minmax.maxY, _minmax.maxY)
        flag = true
      }
    })
    if (flag) {
      const box = {
        left: minmax.minX,
        top: minmax.minY,
        width: minmax.maxX - minmax.minX,
        height: minmax.maxY - minmax.minY,
      }

      const aabbs: Record<number, any> = {}
      element.children.forEach((child, index) => {
        if (child instanceof Element2D) {
          aabbs[index] = child.getGlobalAabb()
        }
      })

      element.style.left += box.left
      element.style.top += box.top
      element.style.width = box.width
      element.style.height = box.height
      element.updateGlobalTransform()

      element.children.forEach((child, index) => {
        if (child instanceof Element2D) {
          child.updateGlobalTransform()
          const oldAabb = aabbs[index]
          const localCenter = child.toLocal({
            x: oldAabb.left + oldAabb.width / 2,
            y: oldAabb.top + oldAabb.height / 2,
          })
          const origin = child.getTransformOrigin()
          const style = child.style
          const offset = [
            localCenter.x - origin.x,
            localCenter.y - origin.y,
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
    inTarget?: 'drawboard' | 'frame',
  ): OrientedBoundingBox {
    let obb
    if (Array.isArray(node) && node.length > 0) {
      if (node.length === 1) {
        obb = getObb(node[0])
      }
      else {
        obb = { ...getAabb(node), rotate: 0 }
      }
    }
    else if (node instanceof Element2D) {
      // for vue reactive
      const style = node.style
      noop([style.left, style.top, style.width, style.height, style.rotate])
      const { rect, rotation } = node.getGlobalObb()
      obb = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        rotate: rotation / DEG_TO_RAD,
      }
    }
    else {
      obb = { left: 0, top: 0, width: 0, height: 0, rotate: 0 }
    }
    if (inTarget === 'drawboard') {
      const zoom = camera.value.zoom
      const position = camera.value.position
      obb.left *= zoom.x
      obb.top *= zoom.y
      obb.width *= zoom.x
      obb.height *= zoom.y
      obb.left += position.x
      obb.top += position.y
    }
    else if (inTarget === 'frame') {
      const first = Array.isArray(node) ? node[0] : node
      if (first instanceof Element2D) {
        const frame = getAncestorFrame(first)
        if (frame) {
          obb.left -= frame.style.left
          obb.top -= frame.style.top
        }
      }
    }
    return obb
  }

  function getObbInDrawboard(node?: Node | Node[]): OrientedBoundingBox {
    return getObb(node, 'drawboard')
  }

  function getAabb(
    node: Node | Node[] | undefined,
    inTarget?: 'drawboard',
  ): AxisAlignedBoundingBox {
    let aabb: AxisAlignedBoundingBox
    if (Array.isArray(node) && node.length > 0) {
      if (node.length === 1) {
        aabb = getAabb(node[0])
      }
      else {
        const minmax = {
          minX: Number.MAX_SAFE_INTEGER,
          minY: Number.MAX_SAFE_INTEGER,
          maxX: Number.MIN_SAFE_INTEGER,
          maxY: Number.MIN_SAFE_INTEGER,
        }
        node.forEach((child) => {
          if (child instanceof Element2D) {
            const aabb = getAabb(child)
            minmax.minX = Math.min(minmax.minX, aabb.left)
            minmax.minY = Math.min(minmax.minY, aabb.top)
            minmax.maxX = Math.max(minmax.maxX, aabb.left + aabb.width)
            minmax.maxY = Math.max(minmax.maxY, aabb.top + aabb.height)
          }
        })
        aabb = {
          left: minmax.minX,
          top: minmax.minY,
          width: minmax.maxX - minmax.minX,
          height: minmax.maxY - minmax.minY,
        }
      }
    }
    else if (node instanceof Element2D) {
      // for vue reactive
      const style = node.style
      noop([style.left, style.top, style.width, style.height, style.rotate])
      const rect = node.getGlobalAabb()
      aabb = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    }
    else {
      aabb = { left: 0, top: 0, width: 0, height: 0 }
    }
    if (inTarget === 'drawboard') {
      aabb = aabbToDrawboardAabb(aabb)
    }
    else if (inTarget === 'frame') {
      const first = Array.isArray(node) ? node[0] : node
      if (first instanceof Element2D) {
        const frame = getAncestorFrame(first)
        if (frame) {
          aabb.left -= frame.style.left
          aabb.top -= frame.style.top
        }
      }
    }
    return aabb
  }

  function getAabbInDrawboard(node?: Node | Node[]): AxisAlignedBoundingBox {
    return getAabb(node, 'drawboard')
  }

  function aabbToDrawboardAabb(aabb: AxisAlignedBoundingBox): AxisAlignedBoundingBox {
    const _aabb = { ...aabb }
    const zoom = camera.value.zoom
    const position = camera.value.position
    _aabb.left *= zoom.x
    _aabb.top *= zoom.y
    _aabb.width *= zoom.x
    _aabb.height *= zoom.y
    _aabb.left += position.x
    _aabb.top += position.y
    return _aabb
  }

  const rootAabb = computed(() => getAabb(root.value?.children ?? []))
  const currentAabb = computed(() => getAabb(selection.value))

  Object.assign(editor, {
    obbToFit,
    getObb,
    getObbInDrawboard,
    getAabb,
    getAabbInDrawboard,
    aabbToDrawboardAabb,
    rootAabb,
    currentAabb,
  })
})
