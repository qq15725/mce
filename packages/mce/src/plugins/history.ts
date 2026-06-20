import type { Ref } from 'vue'
import type * as Y from 'yjs'
import { nextTick, ref } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Editor {
      canUndo: Ref<boolean>
      canRedo: Ref<boolean>
      /** 撤回 / 重做进行中（同步触发底层回退、本 tick 内为 true）。供需要区分「用户操作」与「历史回退」来源的逻辑使用。 */
      isUndoRedoing: Ref<boolean>
      undo: () => void
      redo: () => void
    }

    interface Hotkeys {
      undo: [event: KeyboardEvent]
      redo: [event: KeyboardEvent]
    }

    interface Commands {
      undo: () => void
      redo: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    root,
  } = editor

  const canUndo = ref(false)
  const canRedo = ref(false)
  const isUndoRedoing = ref(false)

  // 标记一次历史回退：同步触发后置 true，nextTick 清除。watch(flush:'pre') 会在 nextTick
  // 回调前执行，故订阅方能在标志期间识别「这次响应式变化来自撤回/重做」。
  function markUndoRedo(fn: () => void): void {
    isUndoRedoing.value = true
    fn()
    nextTick(() => {
      isUndoRedoing.value = false
    })
  }

  function redo(): void {
    markUndoRedo(() => root.value.redo())
  }

  function undo(): void {
    markUndoRedo(() => root.value.undo())
  }

  function onHistoryChanged(um: Y.UndoManager) {
    canUndo.value = um.canUndo()
    canRedo.value = um.canRedo()
  }

  Object.assign(editor, {
    canUndo,
    canRedo,
    isUndoRedoing,
    redo,
    undo,
  })

  return {
    name: 'mce:history',
    commands: [
      { command: 'undo', handle: undo },
      { command: 'redo', handle: redo },
    ],
    hotkeys: [
      { command: 'undo', key: 'CmdOrCtrl+Z' },
      { command: 'redo', key: 'Shift+CmdOrCtrl+Z' },
    ],
    events: {
      historyChanged: onHistoryChanged,
    },
  }
})
