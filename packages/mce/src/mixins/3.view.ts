import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      bindRenderCanvas: (canvas: HTMLCanvasElement, setEventTarget?: HTMLElement) => () => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    renderEngine,
  } = editor

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
    bindRenderCanvas,
  })
})
