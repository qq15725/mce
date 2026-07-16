import type { Element2D } from 'modern-canvas'
import { useEditor } from 'mce'
import { onBeforeUnmount, watchEffect } from 'vue'
import { isWorkflowConnection } from './graph'

/**
 * 连线「能量流动」反馈：workflow 模式下 hover / 选中节点时，相连连线加粗、
 * 并有主题色亮段沿数据方向（output → input）滑动；hover / 选中连线自身同理。
 *
 * 依赖引擎侧 `outline.flow` / `outline.widthBoost`（运行时 internal 属性，
 * 不序列化、不进协同），动画本体在合批 shader 里由 uTime 驱动——这里只负责
 * 开关，不做逐帧工作。
 */

/** 流动速度（周期/秒）：亮段每秒滑过 0.8 个间距。 */
const FLOW_SPEED = 0.8
/**
 * hover 时的描边几何加宽倍率（纯 UI 态，不改文档 width）。
 * WebGL2 下 shader 只把中间 50% 画成线体（视觉加粗 1.6×），外圈留给亮段的
 * 辉光带；WebGL1 没有核心裁剪，直接用视觉倍率。
 */
const WIDTH_BOOST_GL2 = 3.2
const WIDTH_BOOST_GL1 = 1.6

export function useConnectionFlow(): void {
  const editor = useEditor()
  const { mode, hoverElement, elementSelection, root, renderEngine, drawboardDom } = editor

  let flowing = new Set<Element2D>()
  let themeColorSynced = false

  // 亮段颜色取主题主色（CSS 变量是 RGB 三元组）；读不到就用引擎默认的蓝。
  // 首次点亮时才读取——drawboard 挂载后才有主题上下文。
  function syncThemeColor(): void {
    if (themeColorSynced) {
      return
    }
    const el = drawboardDom.value
    const raw = el && getComputedStyle(el).getPropertyValue('--m-theme-primary').trim()
    if (raw) {
      renderEngine.value.flowColor = `rgb(${raw})` as any
    }
    // 周期不再写死：由各 flow 预设的 uFlowPeriod 默认值决定（箭头/生长/虚线各有合适间距）。
    themeColorSynced = true
  }

  function sync(next: Set<Element2D>): void {
    for (const el of flowing) {
      if (!next.has(el)) {
        el.outline.flow = undefined
        el.outline.widthBoost = undefined
      }
    }
    if (next.size) {
      syncThemeColor()
    }
    // widthBoost 加宽几何：streak(辉光) 与 arrow(三角突出于线) 都需要——描边本体只留中间细 core。
    // grow/dash 是线内效果，保持正常线宽。
    const eff = (editor as any).workflowConnectionFlow?.effect ?? 'streak'
    const needsBoost = eff === 'streak' || eff === 'arrow'
    const boost = !needsBoost
      ? undefined
      : (renderEngine.value.renderer as any)?.version === 2
          ? WIDTH_BOOST_GL2
          : WIDTH_BOOST_GL1
    for (const el of next) {
      el.outline.flow = FLOW_SPEED
      el.outline.widthBoost = boost
    }
    flowing = next
  }

  watchEffect(() => {
    const next = new Set<Element2D>()
    // 读一下当前 effect，建立依赖：切换预设时重跑，让 widthBoost 跟着更新。
    void (editor as any).workflowConnectionFlow?.effect
    if (mode.value === 'workflow') {
      // always 模式：所有工作流连线常显流动（供演示 / 宿主整体展示）。
      if ((editor as any).workflowConnectionFlow?.always) {
        for (const child of root.value?.children ?? []) {
          if (isWorkflowConnection(child)) {
            next.add(child as Element2D)
          }
        }
        sync(next)
        return
      }
      // 种子：hover 的元素 + 当前选中的元素
      const seeds = [hoverElement.value, ...elementSelection.value]
        .filter((el): el is Element2D => Boolean(el))
      const nodeIds = new Set<string>()
      for (const el of seeds) {
        if (isWorkflowConnection(el)) {
          next.add(el)
        }
        else {
          // isWorkflowConnection 的守卫会把 else 分支收窄成 never，这里显式还原
          nodeIds.add((el as Element2D).id)
        }
      }
      if (nodeIds.size) {
        // 连线与节点平级：一次线性扫描收齐所有触及种子节点的边
        for (const child of root.value?.children ?? []) {
          if (
            isWorkflowConnection(child)
            && (nodeIds.has(child.connection.start?.id as string)
              || nodeIds.has(child.connection.end?.id as string))
          ) {
            next.add(child as Element2D)
          }
        }
      }
    }
    sync(next)
  })

  onBeforeUnmount(() => sync(new Set()))
}
