import type { Element2D } from 'modern-canvas'
import type { ImagePipeline, PipelineImage } from 'modern-idoc'
import type { Component, Ref } from 'vue'
import type { AnimationPreset, Pipeline } from '../utils'
import { setImagePipelineResolver } from 'modern-canvas'
import { ref, shallowRef } from 'vue'
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

    /**
     * 插件向工具腰带（底部主工具栏）追加的一级按钮（如 @mce/comments 的评论工具）。
     * 底部主工具栏：工具即按钮，带激活高亮 / tooltip / 快捷键提示。
     */
    interface ToolbeltItem {
      /** 图标 / i18n key：图标取 `$<key>`，tooltip 取 `t(key)`，快捷键提示按 key 推断。 */
      key: string
      /** 自定义图标名（默认 `$<key>`）。 */
      icon?: string
      /** 是否激活（高亮）。渲染时调用，读响应式状态即可自动更新。 */
      isActive?: () => boolean
      /** 点击处理。 */
      handle: () => void
      /** 放置在内置工具之前 / 之后（默认 after）。 */
      placement?: 'before' | 'after'
    }

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

      /**
       * 插件向状态栏右侧追加的组件（如 @mce/collaboration 的连接状态 / 在场头像）。
       * Statusbar 据此渲染，核心状态栏不再直接 import 插件组件。
       */
      statusbarItems: Ref<Component[]>
      registerStatusbarItem: (component: Component) => void

      /**
       * 插件向工具腰带追加的一级按钮（如 @mce/comments 的评论工具）。
       * Toolbelt 据此渲染，核心不再硬编码插件工具。
       */
      toolbeltItems: Ref<ToolbeltItem[]>
      registerToolbeltItem: (item: ToolbeltItem) => void

      /**
       * 插件注册的动画预设（进入 / 退出 / 强调）。核心不内置任何预设——
       * Timeline / Trackhead 的「添加动画」菜单据此生成，为空时不显示添加入口。
       * 注册同 id 则覆盖。预设的显示名走 i18n（`t(preset.id)`），由注册方提供文案。
       */
      animationPresets: Ref<AnimationPreset[]>
      registerAnimationPreset: (preset: AnimationPreset) => void
      getAnimationPreset: (id: string) => AnimationPreset | undefined

      /**
       * 插件 / 宿主注册的图片处理管线（`image → image`，如描边/调色/抠图）。
       * 数据只记录管线名与参数（`ImageFill.pipelines`），处理函数为运行时黑盒。
       * 注册同 name 则覆盖。渲染端经引擎解析器烘焙，导出端经 `materializePipelines` 物化。
       */
      pipelines: Ref<Pipeline[]>
      registerPipeline: (pipeline: Pipeline) => void
      getPipeline: (name: string) => Pipeline | undefined
      /** 把一串管线步骤依次作用到图片像素上（引擎解析器与导出物化共用）。 */
      resolvePipelines: (steps: ImagePipeline[], image: PipelineImage) => Promise<PipelineImage>
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
  const toolbeltItems = ref<Mce.ToolbeltItem[]>([])
  const icons = ref<Record<string, string>>({})
  const modes = ref<string[]>([])
  const statusbarItems = shallowRef<Component[]>([])
  const animationPresets = shallowRef<AnimationPreset[]>([])
  const pipelines = shallowRef<Pipeline[]>([])

  // 依次作用管线步骤；未注册的步骤跳过（保证缺插件时不报错、仅丢该效果）。
  const resolvePipelines = async (steps: ImagePipeline[], image: PipelineImage): Promise<PipelineImage> => {
    let current = image
    for (const step of steps) {
      const pipeline = pipelines.value.find(p => p.name === step.name)
      if (!pipeline)
        continue
      current = await pipeline.process(current, step.params)
    }
    return current
  }

  // 注入引擎全局解析器：图片填充加载时由引擎回调，烘焙到运行时纹理。
  setImagePipelineResolver((steps, image) => resolvePipelines(steps, image))

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

    toolbeltItems,
    registerToolbeltItem: (item: Mce.ToolbeltItem) => {
      toolbeltItems.value = [...toolbeltItems.value, item]
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

    statusbarItems,
    registerStatusbarItem: (component: Component) => {
      statusbarItems.value = [...statusbarItems.value, component]
    },

    animationPresets,
    registerAnimationPreset: (preset: AnimationPreset) => {
      const exists = animationPresets.value.some(p => p.id === preset.id)
      animationPresets.value = exists
        ? animationPresets.value.map(p => (p.id === preset.id ? preset : p))
        : [...animationPresets.value, preset]
    },
    getAnimationPreset: (id: string) => animationPresets.value.find(p => p.id === id),

    pipelines,
    registerPipeline: (pipeline: Pipeline) => {
      const exists = pipelines.value.some(p => p.name === pipeline.name)
      pipelines.value = exists
        ? pipelines.value.map(p => (p.name === pipeline.name ? pipeline : p))
        : [...pipelines.value, pipeline]
    },
    getPipeline: (name: string) => pipelines.value.find(p => p.name === name),
    resolvePipelines,
  }
})
