import type { Ref } from 'vue'
import { ref, watch } from 'vue'
import Presence from '../components/Presence.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface PresenceUser {
      /** 业务侧用户 id（可选，用于去重 / 头像）。 */
      id?: string
      /** 展示名。缺省时按 clientId 生成访客名。 */
      name?: string
      /** 主题色（光标 / 选框 / 头像描边）。缺省时按 clientId 从调色板取色。 */
      color?: string
      /** 头像 URL。 */
      avatar?: string
    }

    /** 本端广播 / 远端接收的在场状态。坐标统一用全局画布坐标，与缩放 / 平移无关。 */
    interface PresenceState {
      user?: PresenceUser
      /** 光标位置（全局画布坐标）；离开画布时为 null。 */
      cursor?: { x: number, y: number } | null
      /** 选中的节点 id 列表。 */
      selection?: string[]
    }

    interface Peer extends PresenceState {
      /** yjs clientID，远端唯一标识。 */
      clientId: number
    }

    interface Presence {
      /** 远端在场用户列表（不含本端），随 awareness 变化响应式更新。 */
      peers: Ref<Peer[]>
      /** 本端用户信息。 */
      localUser: Ref<PresenceUser>
      /** 设置本端用户信息并立即广播（连接前调用会在连接后自动应用）。 */
      setUser: (user: Partial<PresenceUser>) => void
    }

    interface Editor {
      presence: Presence
    }
  }
}

/** 默认调色板：按 clientId 取色，保证同一会话内每端颜色稳定。 */
const COLORS = [
  '#F76707',
  '#0CA678',
  '#1C7ED6',
  '#AE3EC9',
  '#E64980',
  '#F59F00',
  '#15AABF',
  '#7048E8',
]

function colorFromId(id: number): string {
  return COLORS[Math.abs(id) % COLORS.length]
}

/**
 * 在场感知（Awareness）：把本端的用户信息 / 光标 / 选区广播给协同对端，并把对端状态收敛为
 * 响应式 `peers` 供 UI 渲染（远端光标、选框）。
 *
 * 职责边界：本插件只管「在场状态」。传输与会话生命周期在 {@link file://./collaboration.ts}，
 * Awareness 协议编解码在 `AbstractProvider`。Awareness 实例随 Provider 走 —— Provider 重建
 * （连接 / 文档切换）后这里会重新接线并补发本端状态。
 */
export default definePlugin((editor) => {
  const peers = ref<Mce.Peer[]>([])
  const localUser = ref<Mce.PresenceUser>({})

  function getAwareness() {
    return editor.collaboration.provider.value?.awareness
  }

  /** 把对端 awareness 状态收敛为 peers（剔除本端）。 */
  function syncPeers(): void {
    const awareness = getAwareness()
    if (!awareness) {
      peers.value = []
      return
    }
    const local = awareness.clientID
    const list: Mce.Peer[] = []
    awareness.getStates().forEach((state, clientId) => {
      if (clientId === local) {
        return
      }
      list.push({ clientId, ...(state as Mce.PresenceState) })
    })
    peers.value = list
  }

  /** 广播本端 user 字段（补齐默认色 / 名）。 */
  function applyLocalUser(): void {
    const awareness = getAwareness()
    if (!awareness) {
      return
    }
    const clientId = awareness.clientID
    const u = localUser.value
    awareness.setLocalStateField('user', {
      ...u,
      color: u.color ?? colorFromId(clientId),
      name: u.name ?? `Guest-${clientId % 1000}`,
    } satisfies Mce.PresenceUser)
  }

  const setUser: Mce.Presence['setUser'] = (user) => {
    localUser.value = { ...localUser.value, ...user }
    applyLocalUser()
  }

  editor.presence = {
    peers,
    localUser,
    setUser,
  }

  return {
    name: 'mce:presence',
    components: [
      { type: 'overlay', component: Presence, order: 'before' },
    ],
    setup: () => {
      const { collaboration, drawboardPointer, selection, getGlobalPointer } = editor

      // Provider 随会话 / 文档切换重建，Awareness 实例也随之更换：重新订阅并补发本端状态。
      watch(collaboration.provider, (provider, _old, onCleanup) => {
        if (!provider) {
          peers.value = []
          return
        }
        const { awareness } = provider
        applyLocalUser()
        awareness.setLocalStateField('selection', selection.value.map(n => n.id))
        awareness.on('change', syncPeers)
        syncPeers()
        onCleanup(() => awareness.off('change', syncPeers))
      }, { immediate: true })

      // 本端光标：drawboardPointer 已在 context 层按 rAF 合并，这里转成全局坐标广播。
      watch(drawboardPointer, () => {
        const awareness = getAwareness()
        if (!awareness) {
          return
        }
        awareness.setLocalStateField(
          'cursor',
          drawboardPointer.value ? { ...getGlobalPointer() } : null,
        )
      })

      // 本端选区。
      watch(selection, () => {
        const awareness = getAwareness()
        if (!awareness) {
          return
        }
        awareness.setLocalStateField('selection', selection.value.map(n => n.id))
      })
    },
  }
})
