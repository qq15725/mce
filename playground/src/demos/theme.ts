import type { Editor } from 'mce'

// 品牌主色预设：用来验证「画布选择框(Selection.vue，画布层)」「工作流端口「+」
// (Workflow.vue，DOM 层)」与连线流动色是否一致跟随 --m-theme-primary。三者同源于
// 同一 token，切任意品牌色都应整体同步变色。任意 demo 下均可用 demobar 的品牌色按钮切换。
export const BRAND_PRESETS = [
  { name: '默认蓝', color: '#4597f8' },
  { name: '活力橙', color: '#f76707' },
  { name: '薄荷绿', color: '#0ca678' },
  { name: '葡萄紫', color: '#7048e8' },
  { name: '玫红', color: '#e64980' },
] as const

// 运行时改品牌主色：写 themeTokens.primary（明暗一致）。themeTokens 为深度响应式——
// 画布经 deep watch 重解析 @primary，DOM 侧 --m-theme-primary 经 EditorLayout 的 computed
// 重算，于是选择框 / 端口「+」/ 连线流动色一起变色。
export function setBrandPrimary(editor: Editor, color: string): void {
  editor.themeTokens.value.primary = { light: color, dark: color }
}
