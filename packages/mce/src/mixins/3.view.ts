import type { ComputedRef } from 'vue'
import type { AxisAlignedBoundingBox } from '../types'
import { Element2D } from 'modern-canvas'
import { computed, watch } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      viewAabb: ComputedRef<AxisAlignedBoundingBox>
      bindRenderCanvas: (canvas: HTMLCanvasElement, setEventTarget?: HTMLElement) => () => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    renderEngine,
    rootAabb,
    currentFrameAabb,
    config,
  } = editor

  const viewAabb = computed(() => {
    return config.value.viewMode === 'frame'
      ? currentFrameAabb.value
      : rootAabb.value
  })

  function bindRenderCanvas(canvas: HTMLCanvasElement, eventTarget?: HTMLElement) {
    function onRendered(): void {
      const target = renderEngine.value.view!
      if (!target.width || !target.height) {
        return
      }
      canvas.width = target.width
      canvas.height = target.height
      canvas.dataset.pixelRatio = target.dataset.pixelRatio
      canvas.getContext('2d')?.drawImage(target, 0, 0, target.width, target.height)
    }

    function unbind() {
      if ((canvas as any)._onRendered) {
        renderEngine.value.off('rendered', (canvas as any)._onRendered)
      }
      renderEngine.value.input.setTarget(renderEngine.value.view!)
    }

    function bind() {
      unbind()
      ;(canvas as any)._onRendered = onRendered
      renderEngine.value.on('rendered', onRendered)
      if (eventTarget) {
        renderEngine.value.input.setTarget(eventTarget)
      }
    }

    bind()

    return unbind
  }

  Object.assign(editor, {
    viewAabb,
    bindRenderCanvas,
  })

  return () => {
    const {
      root,
      currentFrame,
      on,
      exec,
    } = editor

    function onViewMode() {
      switch (config.value.viewMode) {
        case 'frame':
          root.value?.children.forEach((child) => {
            if (child instanceof Element2D) {
              child.visible = child.equal(currentFrame.value)
            }
          })
          break
        case 'edgeless':
          root.value?.children.forEach((child) => {
            if (child instanceof Element2D) {
              child.visible = true
            }
          })
          break
      }
      exec('zoomToFit')
    }

    watch(() => config.value.viewMode, onViewMode)
    on('setCurrentFrame', onViewMode)
    on('setDoc', onViewMode)
  }
})
