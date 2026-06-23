import type { Ref, WritableComputedRef } from 'vue'
import { clamp } from 'modern-canvas'
import { computed, ref } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface PanelTransform {
      left: number
      top: number
      width: number
      height: number
    }

    interface PanelState {
      visible?: boolean
      /** 浮动面板位置 / 尺寸。 */
      transform?: PanelTransform
      /** 停靠面板尺寸（宽或高，按 position）。 */
      size?: number
    }

    interface UIConfig {
      /** 各面板的持久化运行时状态（显隐 / 浮动位置尺寸），按面板 name 索引。 */
      panels: Record<string, PanelState>
    }

    interface PanelsApi {
      /** 面板显隐的可写引用（桥接到 config，统一数据源）。 */
      visibleRef: (name: string) => WritableComputedRef<boolean>
      /** 浮动面板位置 / 尺寸的可写引用（持久化）。 */
      transformRef: (name: string) => WritableComputedRef<PanelTransform | undefined>
      /** 停靠面板尺寸的可写引用（持久化）。 */
      sizeRef: (name: string) => WritableComputedRef<number | undefined>
      /** 浮动面板层叠顺序（内存态，决定 z-index）。 */
      floatOrder: Ref<string[]>
      /** 把某浮动面板提到最前。 */
      bringToFront: (name: string) => void
      /** 浮动面板关闭时移出层叠栈。 */
      release: (name: string) => void
      /** 某浮动面板当前 z-index。 */
      floatZIndex: (name: string) => number
      /** 写入浮动面板位置 / 尺寸（自动做画布边界约束）。 */
      setTransform: (name: string, transform: PanelTransform) => void
    }

    interface Editor {
      /** 面板运行时状态的单一数据源（float 与 dock 共用）。 */
      panels: PanelsApi
    }
  }
}

/** 浮动面板基准层级（高于画布与 dock，低于对话框）。 */
const FLOAT_BASE_Z = 2000
/** 边界约束：拖出画布时至少保留这么多面板宽 / 标题高在可视区内。 */
const KEEP_VISIBLE = 48
const TITLE_HEIGHT = 36

export default defineMixin((editor) => {
  const { registerConfig, drawboardAabb } = editor

  // 直接在 registerConfig 的响应式引用上整体替换 ui.panels，避免依赖深层路径自动建键。
  const panelsConfig = registerConfig<Record<string, Mce.PanelState>>('ui.panels', { default: {} })

  function patch(name: string, partial: Mce.PanelState): void {
    panelsConfig.value = {
      ...panelsConfig.value,
      [name]: { ...panelsConfig.value[name], ...partial },
    }
  }

  function visibleRef(name: string): WritableComputedRef<boolean> {
    return computed({
      get: () => Boolean(panelsConfig.value[name]?.visible),
      set: visible => patch(name, { visible }),
    })
  }

  function transformRef(name: string): WritableComputedRef<Mce.PanelTransform | undefined> {
    return computed({
      get: () => panelsConfig.value[name]?.transform,
      set: transform => patch(name, { transform }),
    })
  }

  function sizeRef(name: string): WritableComputedRef<number | undefined> {
    return computed({
      get: () => panelsConfig.value[name]?.size,
      set: size => patch(name, { size }),
    })
  }

  const floatOrder = ref<string[]>([])

  function bringToFront(name: string): void {
    const next = floatOrder.value.filter(n => n !== name)
    next.push(name)
    floatOrder.value = next
  }

  function release(name: string): void {
    if (floatOrder.value.includes(name))
      floatOrder.value = floatOrder.value.filter(n => n !== name)
  }

  function floatZIndex(name: string): number {
    const index = floatOrder.value.indexOf(name)
    return FLOAT_BASE_Z + (index === -1 ? 0 : index)
  }

  function clampTransform(transform: Mce.PanelTransform): Mce.PanelTransform {
    const ab = drawboardAabb.value
    if (!ab?.width || !ab?.height) {
      return transform
    }
    return {
      ...transform,
      left: clamp(
        transform.left,
        ab.left - transform.width + KEEP_VISIBLE,
        ab.left + ab.width - KEEP_VISIBLE,
      ),
      top: clamp(
        transform.top,
        ab.top,
        ab.top + ab.height - TITLE_HEIGHT,
      ),
    }
  }

  function setTransform(name: string, transform: Mce.PanelTransform): void {
    patch(name, { transform: clampTransform(transform) })
  }

  const panels: Mce.PanelsApi = {
    visibleRef,
    transformRef,
    sizeRef,
    floatOrder,
    bringToFront,
    release,
    floatZIndex,
    setTransform,
  }

  Object.assign(editor, { panels })
})
