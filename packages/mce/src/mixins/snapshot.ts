import type { Element2D, Node } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { render } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Config {
      frameScreenshot: boolean
    }

    interface Editor {
      snapshot: () => void
      captureElementScreenshot: (element: Element | Element2D) => Promise<HTMLCanvasElement>
      captureFrameScreenshot: (pageIndex: number) => void
      renderFrameThumb: (target: HTMLCanvasElement) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    isElement,
    renderEngine,
    frames,
    currentFrameAabb,
    camera,
    frameThumbs,
    log,
    fonts,
    registerConfig,
  } = editor

  registerConfig('frameScreenshot', false)

  async function snapshot(): Promise<void> {
    frameThumbs.value.length = frames.value.length
    for (let i = 0; i < frames.value.length; i++) {
      await captureFrameScreenshot(i)
    }
  }

  async function captureElementScreenshot(element: Element | Element2D): Promise<HTMLCanvasElement> {
    await editor.waitUntilFontLoad()
    let data
    if (isElement(element)) {
      data = element.toJSON()
    }
    else {
      data = { ...element }
    }
    data.style ??= {}
    data.style.top = 0
    data.style.left = 0
    return await render({
      width: data.style.width,
      height: data.style.height,
      fonts,
      data,
    })
  }

  async function captureFrameScreenshot(index: number): Promise<void> {
    const frame = frames.value[index] as Element2D
    if (frame) {
      const canvas = await captureElementScreenshot(frame)
      frameThumbs.value[index] = {
        instanceId: frame.instanceId,
        width: canvas.width,
        height: canvas.height,
        url: canvas.toDataURL(),
      }
      log('captureFrameScreenshot', index)
    }
  }

  function renderFrameThumb(target: HTMLCanvasElement): void {
    const view = renderEngine.value.view
    const aabb = currentFrameAabb.value
    const pixelRatio = renderEngine.value.pixelRatio ?? 1
    if (!view)
      return
    const ctx = target.getContext('2d')
    if (!ctx)
      return
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.clearRect(0, 0, target.width, target.height)
    const { zoom, position } = camera.value
    target.width = aabb.width
    target.height = aabb.height
    const sw = aabb.width * zoom.x
    const sh = aabb.height * zoom.y
    ctx.drawImage(
      view,
      (aabb.left * zoom.x - position.x) * pixelRatio,
      (aabb.top * zoom.x - position.y) * pixelRatio,
      sw * pixelRatio,
      sh * pixelRatio,
      0,
      0,
      target.width,
      target.height,
    )
  }

  Object.assign(editor, {
    snapshot,
    captureElementScreenshot,
    captureFrameScreenshot,
    renderFrameThumb,
  })

  return () => {
    const {
      on,
      config,
      isFrame,
    } = editor

    on('setDoc', (doc) => {
      if (config.value.frameScreenshot) {
        snapshot()
      }

      function onAddChild(node: Node, _newIndex: number): void {
        if (config.value.frameScreenshot && isFrame(node)) {
          const index = frames.value.findIndex(f => f.equal(node))
          frameThumbs.value.splice(index, 0, {
            instanceId: -1,
            width: 0,
            height: 0,
            url: '',
          })
          captureFrameScreenshot(index)
        }
      }

      function onRemoveChild(node: Node, _oldIndex: number): void {
        if (config.value.frameScreenshot && isFrame(node)) {
          frameThumbs.value.splice(
            frameThumbs.value.findIndex(v => v.instanceId === node.instanceId),
            1,
          )
        }
      }

      doc.root.on('addChild', onAddChild)
      doc.root.on('removeChild', onRemoveChild)
    })

    on('setCurrentFrame', (_index: number, oldIndex: number) => {
      if (config.value.frameScreenshot) {
        captureFrameScreenshot(oldIndex)
      }
    })
  }
})
