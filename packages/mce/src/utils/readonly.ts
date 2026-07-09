/**
 * 只读模式命令放行判定 —— 唯一事实来源。
 *
 * 只读下仅允许「不改文档」的命令通过：纯读取（get* / is*）、视图 / 缩放 / 滚动、
 * 面板与 UI 开关、时间轴回放、剪贴板读出（copy）。其余一律拒绝，包括
 * `toggleSelectionLock`、`toggleFlexLayout`、`toggleElementAnimation` 等
 * 「会改文档」的 toggle（旧版按 `^toggle` 前缀误放行）。
 *
 * 该判定在 `exec()` 单点执行，覆盖快捷键 / 右键菜单 / 拖入 / 系统粘贴 / UI 按钮等
 * 一切经命令的写入口；程序化加载（`editor.loadDoc` / `editor.setDoc`）与协同远端
 * 应用不经 `exec`，故不受影响。
 */
const READONLY_SAFE_COMMANDS = new Set<string>([
  // 剪贴板读出（读文档 → 系统剪贴板，不改文档）
  'copy',
  'copyAs',
  // 视图 / 缩放
  'zoomIn',
  'zoomOut',
  'zoomTo',
  'zoomTo100',
  'zoomToFit',
  'zoomToSelection',
  'zoomToNextFrame',
  'zoomToPreviousFrame',
  // 滚动 / 定位
  'scrollTo',
  'scrollToSelection',
  'layerScrollIntoView',
  // 面板 / UI 开关（纯视图）
  'togglePanel',
  'showPanel',
  'hidePanel',
  'setPanelVisible',
  'toggleUi',
  'showUi',
  'hideUi',
  'setUiVisible',
  // 时间轴 / 动画回放（播放态，不改文档）
  'togglePreview',
  'togglePlay',
  'play',
  'pause',
  'seekStart',
  'seekEnd',
  'stepForward',
  'stepBackward',
  'playElementAnimation',
  'pauseElementAnimation',
  'stopElementAnimation',
])

/**
 * 命令在只读模式下是否放行。
 *
 * @param command 命令名（可含 `:` 参数，如 `copyAs:png`、`togglePanel:layers`，按冒号前基名判定）
 */
export function isReadonlySafeCommand(command: string): boolean {
  const name = command.split(':')[0]
  // get* / is* 为读取型查询（getDoc / getState / isFlexLayout …），一律放行。
  if (name.startsWith('get') || name.startsWith('is')) {
    return true
  }
  return READONLY_SAFE_COMMANDS.has(name)
}
