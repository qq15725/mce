import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { render } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
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
    runExclusiveRender,
  } = editor

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
    // 尺寸退回实际包围盒：并非所有元素的 JSON 都带 style.width/height —— 工作流连线把位置和
    // 尺寸直接写进 transform，序列化后 style 只剩 left/top。直接把 undefined 交给 render()
    // 会渲成 1x1 的空图（内核那边已兜底钳到 1，不再崩，但这张缩略图也就废了）。
    const aabb = isElement(element) ? editor.getAabb(element as Element2D) : undefined
    const width = data.style.width ?? aabb?.width
    const height = data.style.height ?? aabb?.height
    return await runExclusiveRender(() => render({
      width,
      height,
      fonts,
      data,
      imagePipelineResolver: editor.resolveImagePipelines,
    }))
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
})
