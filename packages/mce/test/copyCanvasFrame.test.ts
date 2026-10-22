// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { copyCanvasFrame } from '../src/utils/copyCanvasFrame'

function setup() {
  const source = document.createElement('canvas')
  source.width = 640
  source.height = 480
  source.dataset.pixelRatio = '2'
  const canvas = document.createElement('canvas')
  const context = { globalCompositeOperation: 'source-over', drawImage: vi.fn() }
  vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
  const width = vi.spyOn(canvas, 'width', 'set')
  const height = vi.spyOn(canvas, 'height', 'set')
  return { source, canvas, context, width, height }
}

describe('显示画布帧复制', () => {
  it('持续更新画面时不重复设置相同尺寸', () => {
    const { canvas, source, context, width, height } = setup()
    for (let i = 0; i < 60; i++)
      copyCanvasFrame(canvas, source)

    expect(width).toHaveBeenCalledTimes(1)
    expect(height).toHaveBeenCalledTimes(1)
    expect(context.drawImage).toHaveBeenCalledTimes(60)
    expect(context.globalCompositeOperation).toBe('copy')
    expect(canvas.dataset.pixelRatio).toBe('2')
  })

  it('只更新变化的尺寸，并同步像素比例', () => {
    const { canvas, source, width, height } = setup()
    copyCanvasFrame(canvas, source)
    source.width = 800
    source.dataset.pixelRatio = '1'
    copyCanvasFrame(canvas, source)

    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(480)
    expect(width).toHaveBeenCalledTimes(2)
    expect(height).toHaveBeenCalledTimes(1)
    expect(canvas.dataset.pixelRatio).toBe('1')

    delete source.dataset.pixelRatio
    copyCanvasFrame(canvas, source)
    expect(canvas.dataset.pixelRatio).toBeUndefined()
  })

  it('来源尺寸无效时保留上一帧，不清空显示画布', () => {
    const { canvas, source, context, width, height } = setup()
    copyCanvasFrame(canvas, source)
    source.width = 0
    copyCanvasFrame(canvas, source)
    source.width = 640
    source.height = 0
    copyCanvasFrame(canvas, source)

    expect(width).toHaveBeenCalledTimes(1)
    expect(height).toHaveBeenCalledTimes(1)
    expect(context.drawImage).toHaveBeenCalledTimes(1)
  })
})
