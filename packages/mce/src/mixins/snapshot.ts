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
      captureFrameScreenshot: (index: number) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    isElement,
    frames,
    frameThumbs,
    log,
    fonts,
    registerConfig,
  } = editor

  registerConfig('frameScreenshot', false)

  async function snapshot(): Promise<void> {
    frameThumbs.value = frames.value.map(() => ({
      instanceId: -1,
      width: 0,
      height: 0,
      url: '',
    }))
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

  Object.assign(editor, {
    snapshot,
    captureElementScreenshot,
    captureFrameScreenshot,
  })

  return () => {
    const {
      on,
      config,
      inEditorIs,
    } = editor

    on('setDoc', (doc) => {
      if (config.value.frameScreenshot) {
        snapshot()
      }

      function onAddChild(node: Node, _newIndex: number): void {
        if (config.value.frameScreenshot && inEditorIs(node, 'Frame')) {
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
        if (config.value.frameScreenshot && inEditorIs(node, 'Frame')) {
          frameThumbs.value.splice(
            frameThumbs.value.findIndex(v => v.instanceId === node.instanceId),
            1,
          )
        }
      }

      doc.root.on('addChild', onAddChild)
      doc.root.on('removeChild', onRemoveChild)
    })
  }
})
