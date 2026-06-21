import type { YDoc } from 'mce'
import type { Ref, ShallowRef } from 'vue'
import type { AbstractProvider } from './AbstractProvider'
import type { WebsocketProviderOptions } from './WebsocketProvider'
import { definePlugin } from 'mce'
import { onScopeDispose, ref, shallowRef } from 'vue'
import CollaborationStatus from './CollaborationStatus.vue'
import { WebsocketProvider } from './WebsocketProvider'

declare global {
  namespace Mce {
    /**
     * 传输层工厂：拿到当前文档的底层 YDoc，返回一个 Provider 实例。
     * 文档切换时框架会以新文档的 YDoc 重新调用，以重建会话。
     */
    type ProviderFactory = (doc: YDoc) => AbstractProvider

    interface CollaborationConnectOptions {
      /** WebSocket 服务端地址（与 y-websocket 兼容）。与 provider 二选一。 */
      url?: string
      /** 房间名，默认取当前文档 id。 */
      room?: string
      /** 透传给 WebsocketProvider 的可选项（重连间隔、子协议等）。 */
      websocket?: WebsocketProviderOptions
      /** 自定义传输层工厂（WebRTC / BroadcastChannel / 自定义）。提供时忽略 url / room。 */
      provider?: ProviderFactory
    }

    interface Collaboration {
      /** 当前 Provider 实例；未连接时为 undefined。 */
      provider: ShallowRef<AbstractProvider | undefined>
      /** 传输层连接状态。 */
      connected: Ref<boolean>
      /** 是否已与对端完成首次全量同步。 */
      synced: Ref<boolean>
      /** 是否存在活跃的协同会话（connect 后、disconnect 前恒为 true，跨文档切换保持）。 */
      active: Ref<boolean>
      /** 建立协同会话。重复调用会先断开旧会话。返回新建的 Provider（参数非法时返回 undefined）。 */
      connect: (options: CollaborationConnectOptions) => AbstractProvider | undefined
      /** 断开并销毁当前 Provider，结束协同会话。 */
      disconnect: () => void
    }

    interface Options {
      /** 启动时自动建立协同会话。 */
      collaboration?: CollaborationConnectOptions
    }

    interface Editor {
      collaboration: Collaboration
    }

    interface Events {
      /** 传输层连接状态变化。 */
      collaborationStatus: [connected: boolean]
      /** 首次全量同步完成 / 失效。 */
      collaborationSynced: [synced: boolean]
    }
  }
}

/**
 * 协同会话接入：把可插拔的传输层（{@link AbstractProvider} 子类）接到编辑器的文档生命周期上。
 *
 * 职责边界：本插件只管「会话生命周期」——建立 / 销毁 Provider、跨文档切换重建、暴露连接 /
 * 同步状态。协议编解码（sync / awareness）在 {@link AbstractProvider}，字节收发在具体 Provider。
 *
 * 关键不变量：Provider 绑定在某个具体的底层 YDoc 上（`Doc._yDoc`）。`setDoc` 切换文档时旧
 * YDoc 会被 destroy，故必须以新文档的 YDoc 重建 Provider —— 这里订阅 `docSet` 事件完成重建。
 */
export default definePlugin((editor, options) => {
  const provider = shallowRef<AbstractProvider | undefined>()
  const connected = ref(false)
  const synced = ref(false)
  const active = ref(false)

  // 当前会话的传输层工厂；文档切换时据此重建 Provider。
  let factory: Mce.ProviderFactory | undefined

  /** 销毁当前 Provider 并复位状态（保留 factory / active，供文档切换后重建）。 */
  function teardown(): void {
    const p = provider.value
    if (p) {
      p.destroy()
      provider.value = undefined
    }
    connected.value = false
    synced.value = false
  }

  /** 用当前 factory 针对当前文档的 YDoc 建立 Provider 并接线状态。 */
  function spawn(): AbstractProvider | undefined {
    if (!factory) {
      return undefined
    }
    const ydoc = editor.root.value._yDoc
    const p = factory(ydoc)
    p.on('status', ({ connected: value }) => {
      connected.value = value
      editor.emit('collaborationStatus', value)
    })
    p.on('synced', (value) => {
      synced.value = value
      editor.emit('collaborationSynced', value)
    })
    // Provider 可能在构造时已 onOpen / 同步（如 BroadcastChannel 同步触发），
    // 此时 status / synced 事件早于上面挂载的监听 → 补读一次状态初值兜底。
    connected.value = p.connected
    synced.value = p.synced
    provider.value = p
    return p
  }

  const connect: Mce.Collaboration['connect'] = (options) => {
    teardown()
    if (options.provider) {
      factory = options.provider
    }
    else if (options.url) {
      const { url, room, websocket } = options
      factory = doc => new WebsocketProvider(url, room ?? editor.root.value.id, doc, websocket)
    }
    else {
      console.warn('[collaboration] connect 需要提供 url 或 provider')
      return undefined
    }
    active.value = true
    return spawn()
  }

  const disconnect: Mce.Collaboration['disconnect'] = () => {
    active.value = false
    factory = undefined
    teardown()
  }

  // 文档切换：Provider 绑定在旧 YDoc 上，必须以新 YDoc 重建，否则会话会指向已销毁的文档。
  // teardown 用 try/finally 兜底：即便某个 Provider 在 destroy 时抛错，也保证 spawn 照常执行，
  // 不让一次销毁异常把整条协同会话卡死。
  function onDocSet(): void {
    if (!active.value) {
      return
    }
    try {
      teardown()
    }
    finally {
      spawn()
    }
  }

  editor.collaboration = {
    provider,
    connected,
    synced,
    active,
    connect,
    disconnect,
  }

  // 状态栏连接状态 + 在场头像（核心状态栏经 statusbarItems 渲染）。
  editor.registerStatusbarItem(CollaborationStatus)

  return {
    name: 'mce:collaboration',
    messages: {
      en: {
        'collaboration:synced': 'Synced',
        'collaboration:connecting': 'Connecting…',
        'collaboration:offline': 'Offline',
      },
      zhHans: {
        'collaboration:synced': '已同步',
        'collaboration:connecting': '连接中…',
        'collaboration:offline': '离线',
      },
    },
    setup: () => {
      editor.on('docSet', onDocSet)

      if (options.collaboration) {
        connect(options.collaboration)
      }

      onScopeDispose(() => {
        editor.off('docSet', onDocSet)
        factory = undefined
        active.value = false
        teardown()
      })
    },
  }
})
