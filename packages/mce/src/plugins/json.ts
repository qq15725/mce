import type { Element2D } from 'modern-canvas'
import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface JsonData {
      id: string
      style: {
        width: number
        height: number
        transformOrigin: string
        transform: string
      }
      children: NormalizedElement[]
      meta: {
        inPptIs: 'Pptx'
        inEditorIs: 'Doc'
        inCanvasIs: 'Element2D'
        startTime: number
        endTime: number
      }
    }

    interface Exporters {
      json: JsonData
    }
  }
}

export default definePlugin((editor, options) => {
  const {
    getAabb,
    elementSelection,
    root,
    getTimeRange,
  } = editor

  const { docName } = options
  const RE = /\.json$/i

  return {
    name: 'mce:json',
    loaders: [
      {
        name: 'json',
        accept: '.json',
        test: (source) => {
          if (source instanceof Blob) {
            if (source.type.startsWith('application/json')) {
              return true
            }
          }
          if (source instanceof File) {
            if (RE.test(source.name)) {
              return true
            }
          }
          return false
        },
        load: async (source: File | Blob) => {
          const json = JSON.parse(await source.text())
          // 旧的「gaoding 风格 schema (version + elements)」识别分支只 logger.debug 不做实际转换，
          // 属于占位死代码，删除；若日后真要支持，应在此处接 schema 适配器再返回。
          return json
        },
      },
    ],
    exporters: [
      {
        name: 'json',
        handle: (options) => {
          const {
            selected = false,
            scale = 1,
          } = options

          let id = idGenerator()
          let name = docName ?? 'Doc'
          let elements: Element2D[] = []
          if (Array.isArray(selected)) {
            elements = selected
          }
          else {
            if (selected === true) {
              elements = elementSelection.value
            }

            if (elements.length === 0 && root.value) {
              id = root.value.id
              name = root.value.name
              elements = root.value.children as Element2D[]
            }
          }

          const { left, top, width, height } = getAabb(elements, 'parent')

          return {
            id,
            name,
            style: {
              width: width * scale,
              height: height * scale,
              transformOrigin: 'left top',
              transform: `scale(${scale})`,
            },
            children: elements.map((el) => {
              const json = el.toJSON()
              // 无 style 的元素（如连线：位置/尺寸直写 transform，不经 style，序列化后 style 缺省）
              // 也要能偏移，否则 style.left=… 会在 undefined 上抛 TypeError，整个导出 reject。
              const style = (json.style ??= {})
              if (left) {
                style.left = (style.left ?? 0) - left
              }
              if (top) {
                style.top = (style.top ?? 0) - top
              }
              json.meta ??= {}
              json.meta.inPptIs = 'Slide'
              return json
            }),
            meta: {
              inPptIs: 'Pptx',
              inEditorIs: 'Doc',
              inCanvasIs: 'Element2D',
              ...getTimeRange(elements),
            },
          } as any
        },
      },
    ],
  }
})
