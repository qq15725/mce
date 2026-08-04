import { describe, expect, it } from 'vitest'
import jsonPlugin from './json'

/** 最小 editor 桩：json 导出器只用到这几个能力。 */
function createEditorStub(root: any): any {
  return {
    getAabb: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    elementSelection: { value: [] as any[] },
    root: { value: root },
    getTimeRange: () => ({ startTime: 0, endTime: 0 }),
    themeTokens: { value: {} },
  }
}

function createElementStub(name: string): any {
  return { toJSON: () => ({ name, style: { left: 0, top: 0 } }) }
}

function exportJson(editor: any, options: any = {}): any {
  const plugin = (jsonPlugin as any)(editor, { docName: 'Doc' })
  return plugin.exporters[0].handle(options)
}

describe('json 导出器：doc 根 meta', () => {
  const el = createElementStub('el-1')
  const root = {
    id: 'doc-1',
    name: '未命名',
    children: [el],
    meta: {
      toJSON: () => ({
        // 文档里若混进了契约字段的脏值，导出必须以契约为准
        inPptIs: '脏值',
        sourceTid: '(miao_ai_workflows.uuid=abc).content_url',
      }),
    },
  }

  it('整文档导出透传 doc 根 meta 上的业务字段', () => {
    const json = exportJson(createEditorStub(root))
    expect(json.meta.sourceTid).toBe('(miao_ai_workflows.uuid=abc).content_url')
  })

  it('导出格式的固定字段不被文档里的同名值改写', () => {
    const json = exportJson(createEditorStub(root))
    expect(json.meta.inPptIs).toBe('Pptx')
    expect(json.meta.inEditorIs).toBe('Doc')
    expect(json.meta.inCanvasIs).toBe('Element2D')
  })

  it('导出指定元素（非整份文档）时不带 doc meta', () => {
    const json = exportJson(createEditorStub(root), { selected: [el] })
    expect(json.meta.sourceTid).toBeUndefined()
    expect(json.meta.inPptIs).toBe('Pptx')
  })
})
