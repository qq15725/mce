import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type SaveReason = 'auto' | 'hotkey' | 'manual'

    interface SaveEvent {
      /** 触发来源：自动保存 / 快捷键 / 外部主动调用 */
      reason: SaveReason
      /** 惰性取当前文档数据（仅在外部需要时序列化） */
      getData: () => JsonData
    }

    interface AutoSaveConfig {
      /** 是否在文档变更后自动触发 save 事件 */
      enabled: boolean
      /** 变更后空闲多久（ms）才触发，debounce 合并连续编辑 */
      debounceMs: number
    }

    interface Config {
      autoSave: AutoSaveConfig
    }

    interface Editor {
      /** 请求保存：仅对外抛出 'save' 事件，实际持久化由外部消费者处理 */
      save: (reason?: SaveReason) => void
    }

    interface Commands {
      save: (reason?: SaveReason) => void
    }

    interface Hotkeys {
      save: [event: KeyboardEvent]
    }

    interface Events {
      /** 保存请求；外部通过 editor.on('save', ({ reason, getData }) => ...) 处理持久化 */
      save: [event: SaveEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    emit,
    getDoc,
    docLoading,
    registerConfig,
  } = editor

  const autoSave = registerConfig<Mce.AutoSaveConfig>('autoSave', {
    default: {
      enabled: true,
      debounceMs: 2000,
    },
  })

  const save: Mce.Editor['save'] = (reason = 'manual') => {
    emit('save', { reason, getData: getDoc })
  }

  // debounce 用手动计时器实现，便于每次调度时实时读取最新 debounceMs（支持运行时改配置）。
  let timer: ReturnType<typeof setTimeout> | undefined
  function scheduleAutoSave(): void {
    const { enabled, debounceMs } = autoSave.value
    if (!enabled) {
      return
    }
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      save('auto')
    }, debounceMs)
  }

  Object.assign(editor, { save })

  return {
    name: 'mce:save',
    commands: [
      { command: 'save', handle: save },
    ],
    hotkeys: [
      // 默认 preventDefault=true，拦截浏览器自带的保存弹窗。
      { command: 'save', key: 'CmdOrCtrl+S', handle: () => save('hotkey') },
    ],
    events: {
      // 文档变更后调度自动保存；加载文档过程中的增量不算用户编辑，跳过。
      docUpdated: () => {
        if (docLoading.value) {
          return
        }
        scheduleAutoSave()
      },
    },
  }
})
