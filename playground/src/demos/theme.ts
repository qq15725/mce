import type { Editor } from 'mce'
import { loadWorkflowDemo } from './workflow'

// 品牌主色预设：用来验证「画布选择框(Selection.vue，画布层)」与「工作流端口「+」
// (Workflow.vue，DOM 层)」是否一致跟随 --m-theme-primary。二者同源于同一 token，
// 切任意品牌色都应整体同步变色（此前端口曾被硬编码成 #4597f8，宿主改主色时会脱节）。
export const BRAND_PRESETS = [
  { name: '默认蓝', color: '#4597f8' },
  { name: '活力橙', color: '#f76707' },
  { name: '薄荷绿', color: '#0ca678' },
  { name: '葡萄紫', color: '#7048e8' },
  { name: '玫红', color: '#e64980' },
] as const

// 运行时改品牌主色：写 themeTokens.primary（明暗一致）。themeTokens 为深度响应式——
// 画布经 deep watch 重解析 @primary，DOM 侧 --m-theme-primary 经 EditorLayout 的 computed
// 重算，于是选择框与端口「+」同帧一起变色。
export function setBrandPrimary(editor: Editor, color: string): void {
  editor.themeTokens.value.primary = { light: color, dark: color }
}

// 主题色示例：复用工作流场景（端口「+」可见），默认选中一个节点让选择框也同屏可见，
// 便于对比「切品牌色时选择框与端口是否一致跟随」。
export function loadThemeDemo(editor: Editor): void {
  loadWorkflowDemo(editor)
  // 待工作流场景就位（loadWorkflowDemo 内部 120ms 后 zoomToFit）再选中一个节点。
  setTimeout(() => {
    const el = editor.getNodeById('wf-img2')
    if (el && editor.isElement(el)) {
      editor.elementSelection.value = [el]
    }
  }, 220)
}
