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
  const { mode, hoverElement, elementSelection, root, renderEngine, drawboardDom } = useEditor()

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
    // 亮段间距按 2048 节点尺度取值（亮段约占 30%，即 ~500 路径像素）——
    // 固定物理长度，长短连线上的亮段大小一致。
    renderEngine.value.flowPeriod = 1600
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
    const boost = (renderEngine.value.renderer as any)?.version === 2
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
    if (mode.value === 'workflow') {
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
