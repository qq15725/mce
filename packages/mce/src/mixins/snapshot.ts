import type { Element2D, Node } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { render } from 'modern-canvas'
import { defineMixin } from '../editor'

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

  async function captureFrameScreenshot(pageIndex: number): Promise<void> {
    const frame = frames.value[pageIndex] as Element2D
    if (frame) {
      const canvas = await captureElementScreenshot(frame)
      frameThumbs.value[pageIndex] = {
        width: canvas.width,
        height: canvas.height,
        url: canvas.toDataURL(),
      }
      log('captureFrameScreenshot', pageIndex)
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
    } = editor

    on('setDoc', (doc) => {
      if (config.value.frameScreenshot) {
        snapshot()
      }

      function onAppendChild(node: Node): void {
        if (config.value.frameScreenshot) {
          const index = node.getIndex()
          frameThumbs.value.splice(index, 0, {
            width: 0,
            height: 0,
            url: '',
          })
          captureFrameScreenshot(index)
        }
      }

      doc.root.on('appendChild', onAppendChild)
    })

    on('setCurrentFrame', (_index: number, oldIndex: number) => {
      if (config.value.frameScreenshot) {
        captureFrameScreenshot(oldIndex)
      }
    })
  }
})
