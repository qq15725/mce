import type { Element2D, Vector2Like } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface NestIntoFrameOptions {
      pointer: Vector2Like
      parent: Element2D
      index: number
      excluded: Set<number>
    }

    interface Commands {
      nestIntoFrame: (
        element: Element2D,
        options?: NestIntoFrameOptions,
      ) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    getGlobalPointer,
    frames,
    isFrameNode,
    exec,
    root,
    elementSelection,
  } = editor

  let startContext = {} as Record<string, any>

  function nestIntoFrame(
    el: Element2D,
    options?: Mce.NestIntoFrameOptions,
  ): void {
    const pointer = options?.pointer as any
    const frame1 = el.findAncestor(node => isFrameNode(node, true))
    const aabb1 = el.globalAabb
    const area1 = aabb1.getArea()
    let flag = true
    for (let i = 0, len = frames.value.length; i < len; i++) {
      const frame2 = frames.value[i]
      if (options?.excluded.has(frame2.instanceId) || frame2.equal(el)) {
        continue
      }
      const aabb2 = frame2.globalAabb
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
          frame2.moveChild(el, index)
          el.style.left = aabb1.x - aabb2.x
          el.style.top = aabb1.y - aabb2.y
          el.updateGlobalTransform()
          exec('layerScrollIntoView')
        }
        flag = false
        break
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
      root.value.moveChild(el, index)
      el.style.left = aabb1.x
      el.style.top = aabb1.y
      el.updateGlobalTransform()
      exec('layerScrollIntoView')
    }
  }

  return {
    name: 'mce:autoNest',
    commands: [
      { command: 'nestIntoFrame', handle: nestIntoFrame },
    ],
    events: {
      selectionTransformStart: ({ handle, startEvent }) => {
        if (handle === 'move' && !(startEvent as any)?.__FROM__) {
          const pointer = getGlobalPointer()
          const startFrame = frames.value.find(frame => frame.globalAabb.contains(pointer))

          const idSet = new Set<number>()
          elementSelection.value.forEach((el) => {
            const frame = isFrameNode(el, true) ? el : el.findAncestor(v => isFrameNode(v, true))
            if (frame) {
              if (frame.equal(startFrame)) {
                idSet.add(frame.instanceId)
              }
            }
            else {
              idSet.add(0)
            }
          })
          if (idSet.size === 1) {
            const ctx: Record<string, any> = {}
            elementSelection.value.forEach((el) => {
              ctx[el.instanceId] = {
                parent: el.getParent(),
                index: el.getIndex(),
              }
            })
            startContext = ctx
          }
        }
      },
      selectionTransform: ({ handle, startEvent }) => {
        if (handle === 'move' && !(startEvent as any)?.__FROM__) {
          if (Object.keys(startContext).length > 0) {
            const excluded = new Set(elementSelection.value.map(el => el.instanceId))
            elementSelection.value.forEach((el) => {
              nestIntoFrame(
                el,
                {
                  ...startContext[el.instanceId],
                  pointer: getGlobalPointer(),
                  excluded,
                } as any,
              )
            })
          }
        }
      },
      selectionTransformEnd: () => {
        startContext = {}
      },
    },
  }
})
