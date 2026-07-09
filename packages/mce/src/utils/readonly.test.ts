import { describe, expect, it } from 'vitest'
import { isReadonlySafeCommand } from './readonly'

describe('isReadonlySafeCommand', () => {
  it('放行读取型查询（get* / is*）', () => {
    for (const c of ['getDoc', 'getState', 'getTransform', 'isFlexLayout', 'isPanelVisible', 'isUiVisible']) {
      expect(isReadonlySafeCommand(c)).toBe(true)
    }
  })

  it('放行视图 / 缩放 / 滚动 / 面板 / UI / 回放 / 复制', () => {
    for (const c of [
      'copy', 'copyAs', 'copyAs:png',
      'zoomIn', 'zoomToFit', 'zoomToSelection',
      'scrollTo', 'scrollToSelection', 'layerScrollIntoView',
      'togglePanel', 'togglePanel:layers', 'setPanelVisible', 'showPanel',
      'toggleUi', 'toggleUi:ruler', 'setUiVisible',
      'togglePreview', 'togglePlay', 'play', 'pause',
    ]) {
      expect(isReadonlySafeCommand(c)).toBe(true)
    }
  })

  it('拦截会改文档的 toggle（旧版 ^toggle 前缀误放行的回归点）', () => {
    for (const c of ['toggleSelectionLock', 'toggleSelectionVisible', 'toggleFlexLayout', 'toggleElementAnimation']) {
      expect(isReadonlySafeCommand(c)).toBe(false)
    }
  })

  it('拦截各类写命令', () => {
    for (const c of [
      'paste', 'cut', 'delete', 'duplicate',
      'newDoc', 'openDoc', 'save', 'saveAs',
      'align', 'groupSelection', 'ungroupSelection',
      'setTransform', 'setTextStyle', 'move', 'rotate',
      'addTextElement', 'insertImage', 'importFile',
      'undo', 'redo', 'activateTool', 'activateTool:rectangle',
    ]) {
      expect(isReadonlySafeCommand(c)).toBe(false)
    }
  })
})
