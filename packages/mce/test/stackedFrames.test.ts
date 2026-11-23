import { expect, it } from 'vitest'
import { reactive, shallowRef } from 'vue'
import frameMixin from '../src/mixins/4.2.frame'

it('duplicates a sibling, shifts unequal heights, and preserves the gap when moving', () => {
  const makePage = (top: number, height: number) => ({
    style: reactive({ top, height, left: 12 }),
    getIndex: () => 1,
    equal(other: unknown) { return other === this },
    toJSON() { return this.style },
  })
  const first = makePage(0, 200)
  const last = makePage(220, 120)
  const frames = shallowRef([last, first])
  const root = { transact: (fn: () => unknown) => fn(), moveChild: () => {} }
  const editor: any = {
    root: shallowRef(root), frames,
    config: { value: { canvas: { frame: { gap: 32 } } } },
    camera: { value: { zoom: { x: 0.5, y: 2 } } },
    addElement(style: typeof first.style, options: any) {
      expect(options).toMatchObject({ parent: root, regenId: true })
      const copy = makePage(style.top, style.height)
      frames.value = [last, copy, first]
      return copy
    },
  }
  frameMixin(editor, { minFrameScreenGap: 48 })
  expect([editor.getFrameGap('x'), editor.getFrameGap('y')]).toEqual([96, 32])
  const copy = editor.duplicateStackedFrame(first)
  expect([first.style.top, copy.style.top, last.style.top]).toEqual([0, 200, 420])
  editor.moveStackedFrame(last, -1)
  expect([first.style.top, last.style.top, copy.style.top]).toEqual([0, 200, 340])
  editor.moveStackedFrame(last, 1)
  expect([first.style.top, copy.style.top, last.style.top]).toEqual([0, 200, 420])
})
