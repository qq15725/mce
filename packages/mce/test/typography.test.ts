import { measureText } from 'modern-text'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import typographyPlugin from '../src/plugins/typography'

vi.mock('modern-text', () => ({
  measureText: vi.fn(() => ({
    boundingBox: { width: 846, height: 500 },
  })),
}))
vi.mock('../src/components/TextEditor.vue', () => ({ default: {} }))
vi.mock('../src/web-components', () => ({
  TextEditor: { register: vi.fn() },
}))

function createTextElement(isVertical = false): any {
  return {
    style: {
      width: 810,
      height: 465,
      toJSON() {
        return { width: this.width, height: this.height }
      },
    },
    text: {
      isValid: () => true,
      base: { isVertical },
      content: [{ fragments: [{ content: '正文' }] }],
    },
    requestDraw: vi.fn(),
    findOne: vi.fn(),
  }
}

function getTextToFit(): Mce.Commands['textToFit'] {
  const editor = {
    isElement: () => false,
    elementSelection: ref([]),
    textSelection: ref([]),
    fonts: {},
    registerConfig: () => ref({ strategy: 'autoHeight' }),
    t: (value: string) => value,
    addElement: vi.fn(),
    activateTool: vi.fn(),
  }
  const plugin = (typographyPlugin as any)(editor, {})
  return plugin.commands.find((item: any) => item.command === 'textToFit').handle
}

describe('textToFit', () => {
  it('横排 autoHeight 仅自适应高度并保持定宽', () => {
    const element = createTextElement()
    getTextToFit()(element, 'autoHeight')

    expect(measureText).toHaveBeenCalled()
    expect(element.style.width).toBe(810)
    expect(element.style.height).toBe(500)
  })

  it('横排 autoWidth 仅自适应宽度并保持定高', () => {
    const element = createTextElement()
    getTextToFit()(element, 'autoWidth')

    expect(element.style.width).toBe(846)
    expect(element.style.height).toBe(465)
  })

  it('竖排 autoHeight 仅自适应宽度并保持定高', () => {
    const element = createTextElement(true)
    getTextToFit()(element, 'autoHeight')

    expect(element.style.width).toBe(846)
    expect(element.style.height).toBe(465)
  })

  it('竖排 autoWidth 仅自适应高度并保持定宽', () => {
    const element = createTextElement(true)
    getTextToFit()(element, 'autoWidth')

    expect(element.style.width).toBe(810)
    expect(element.style.height).toBe(500)
  })
})
