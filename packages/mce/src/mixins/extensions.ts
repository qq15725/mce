import type { Element2D } from 'modern-canvas'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    /**
     * 把命中的节点重定向到真正应被选中的节点（如表格单元格 → 表格元素）。
     * 返回 undefined 表示不改写。由插件注册，供选择 / 悬停策略统一应用。
     */
    type SelectionRedirect = (node: Element2D, editor: Editor) => Element2D | undefined

    /**
     * 自定义某元素的缩放行为（如表格按行列网格重算尺寸而非整体缩放）。
     * 返回 true 表示已处理、跳过默认缩放；返回 false 走默认。
     */
    interface ResizeOverrideContext {
      scaleX: number
      scaleY: number
      newWidth: number
      newHeight: number
      options: Mce.ResizeElementOptions
    }
    type ResizeOverride = (element: Element2D, context: ResizeOverrideContext) => boolean

    /**
     * 进入元素编辑（Enter / 双击）。返回 true 表示已处理，停止后续 handler 与核心默认行为。
     */
    type EnterHandler = (element: Element2D, editor: Editor) => boolean

    interface Editor {
      /** 选择重定向链。 */
      selectionRedirects: SelectionRedirect[]
      registerSelectionRedirect: (fn: SelectionRedirect) => void
      /** 依次应用所有重定向，得到最终应被选中的节点。 */
      resolveSelectionRedirect: (node: Element2D | undefined) => Element2D | undefined

      /** 缩放行为覆盖链。 */
      resizeOverrides: ResizeOverride[]
      registerResizeOverride: (fn: ResizeOverride) => void
      /** 应用覆盖；返回 true 表示某插件已处理缩放。 */
      applyResizeOverride: (element: Element2D, context: ResizeOverrideContext) => boolean

      /** 进入编辑处理链。 */
      enterHandlers: EnterHandler[]
      registerEnterHandler: (fn: EnterHandler) => void

      /**
       * 内容编辑态集合：处于这些 state 时隐藏选择框 / 浮动条、抑制快捷键。
       * 默认空；由插件注册自己的编辑态（如 table 注册 'tableEditing'）。
       * 注意：核心的 'typing' 不在此集合，仍按原有逻辑各处单独处理。
       */
      editingStates: Set<string>
      registerEditingState: (state: string) => void
      /** 当前是否处于某个已注册的内容编辑态。 */
      isContentEditing: () => boolean

      /**
       * 插件向工具栏「形状」下拉追加的工具 key（如 @mce/table 的 'table'、@mce/chart 的图表）。
       * key 同时是工具名（activateTool(key)）与图标 / 文案 key。
       */
      toolbeltShapeItems: Ref<string[]>
      registerToolbeltShapeItem: (key: string) => void

      /**
       * 插件注册的图标：alias 名（不含 `$`）→ SVG path。会在 EditorLayout 创建图标集时
       * 合并进 IconsSymbol 的 aliases，从而让 `$<name>` 可解析。供 @mce/table、@mce/chart
       * 等把自己的图标随插件携带，核心图标集不再硬编码它们。
       */
      icons: Ref<Record<string, string>>
      registerIcon: (name: string, path: string) => void

      /**
       * 插件注册的编辑模式（除核心 'canvas' 外，如 @mce/workflow 的 'workflow'）。
       * 菜单的模式切换项据此生成；模式 UI 由插件以 overlay 组件按 mode 自行条件渲染。
       */
      modes: Ref<string[]>
      registerMode: (mode: string) => void
    }
  }
}

/**
 * 通用扩展点：让插件（如 @mce/table、@mce/chart）把原本硬编码在核心里的特例行为
 * （选择重定向、缩放覆盖、进入编辑、内容编辑态）注册进来，从而把元素类型相关逻辑
 * 从核心解耦出去。
 */
export default defineMixin((editor) => {
  const selectionRedirects: Mce.SelectionRedirect[] = []
  const resizeOverrides: Mce.ResizeOverride[] = []
  const enterHandlers: Mce.EnterHandler[] = []
  const editingStates = new Set<string>()
  const toolbeltShapeItems = ref<string[]>([])
  const icons = ref<Record<string, string>>({})
  const modes = ref<string[]>([])

  return {
    selectionRedirects,
    registerSelectionRedirect: (fn: Mce.SelectionRedirect) => {
      selectionRedirects.push(fn)
    },
    resolveSelectionRedirect: (node: Element2D | undefined) => {
      if (!node) {
        return node
      }
      let result = node
      for (const fn of selectionRedirects) {
        result = fn(result, editor) ?? result
      }
      return result
    },

    resizeOverrides,
    registerResizeOverride: (fn: Mce.ResizeOverride) => {
      resizeOverrides.push(fn)
    },
    applyResizeOverride: (element: Element2D, context: Mce.ResizeOverrideContext) => {
      return resizeOverrides.some(fn => fn(element, context))
    },

    enterHandlers,
    registerEnterHandler: (fn: Mce.EnterHandler) => {
      enterHandlers.push(fn)
    },

    editingStates,
    registerEditingState: (state: string) => {
      editingStates.add(state)
    },
    isContentEditing: () => editingStates.has(editor.state.value as string),

    toolbeltShapeItems,
    registerToolbeltShapeItem: (key: string) => {
      if (!toolbeltShapeItems.value.includes(key)) {
        toolbeltShapeItems.value.push(key)
      }
    },

    icons,
    registerIcon: (name: string, path: string) => {
      icons.value[name] = path
    },

    modes,
    registerMode: (mode: string) => {
      if (!modes.value.includes(mode)) {
        modes.value.push(mode)
      }
    },
  }
})
