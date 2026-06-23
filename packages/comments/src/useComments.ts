import type { Editor } from 'mce'
import type { ComputedRef } from 'vue'
import { useEditor } from 'mce'
import { computed, onScopeDispose, ref } from 'vue'

/** 评论作者。 */
export interface CommentAuthor {
  id?: string
  name?: string
  color?: string
  initials?: string
}

/** 线程中的单条消息。 */
export interface CommentMessage {
  id: string
  author?: CommentAuthor
  body: string
  createdAt?: number
}

/** 聚合后的线程视图：携带所属元素节点 + idoc 线程字段。 */
export interface CommentThreadView {
  /** 所属元素节点（运行时 Element2D）。 */
  node: any
  id: string
  /** 相对所属元素原点的偏移。 */
  offset: { x: number, y: number }
  resolved: boolean
  messages: CommentMessage[]
}

export interface CommentsApi {
  /** 全树聚合的线程（按创建时间升序）。 */
  threads: ComputedRef<CommentThreadView[]>
  /** 在某元素上新建线程，offset 为相对该元素原点的局部坐标，返回线程 id。 */
  addThread: (node: any, offset: { x: number, y: number }, body: string) => string
  /** 向线程追加回复。 */
  reply: (node: any, threadId: string, body: string) => void
  /** 解决 / 取消解决。 */
  resolve: (node: any, threadId: string, resolved: boolean) => void
  /** 删除线程。 */
  remove: (node: any, threadId: string) => void
  /** 全局画布坐标 → 画板（屏幕）像素。 */
  toScreen: (p: { x: number, y: number }) => { x: number, y: number }
  /** 画板（屏幕）像素 → 全局画布坐标。 */
  toWorld: (p: { x: number, y: number }) => { x: number, y: number }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * 评论数据层：评论作为元素能力存于 `element.comments`（idoc CommentThread[]），
 * 经 modern-canvas 的 Element2DComments + mce CRDT 逐线程同步。
 * - 读：遍历文档树聚合各节点的 comments → 扁平线程视图（含所属 node）。
 * - 写：按节点 per-thread `setProperty(threadId, thread)`，保留逐线程并发合并。
 * - 位置：线程 offset 为元素局部坐标，渲染时经元素世界矩阵还原。
 */
export function createCommentsStore(editor: Editor): CommentsApi {
  const { root } = editor

  // 变更信号：评论经 toJSON 读 _properties，不一定建立 Vue 依赖；用一个 tick 兜底——
  // 本地写后 bump，远端 / 任意 CRDT 事务经 YDoc 'update' 也 bump，保证聚合刷新。
  const tick = ref(0)
  function bump(): void {
    tick.value++
  }
  let detachUpdate: (() => void) | undefined
  function bindUpdate(): void {
    detachUpdate?.()
    const ydoc: any = root.value._yDoc
    ydoc.on('update', bump)
    detachUpdate = () => ydoc.off('update', bump)
  }
  bindUpdate()
  editor.on('docSet', bindUpdate)
  onScopeDispose(() => {
    detachUpdate?.()
    editor.off('docSet', bindUpdate)
  })

  function collect(node: any, out: CommentThreadView[]): void {
    const threads = node?.comments?.toJSON?.() as CommentThreadView[] | undefined
    if (threads?.length) {
      threads.forEach((t) => {
        out.push({
          node,
          id: t.id,
          offset: t.offset ?? { x: 0, y: 0 },
          resolved: Boolean(t.resolved),
          messages: (t.messages ?? []) as CommentMessage[],
        })
      })
    }
    node?.children?.forEach((child: any) => collect(child, out))
  }

  const threads = computed<CommentThreadView[]>(() => {
    void tick.value // 变更信号依赖
    const out: CommentThreadView[] = []
    collect(root.value, out)
    return out.sort((a, b) => (a.messages[0]?.createdAt ?? 0) - (b.messages[0]?.createdAt ?? 0))
  })

  function author(): CommentAuthor {
    const u = (editor as any).presence?.localUser?.value
    return { name: u?.name || '我', color: u?.color || '#1C7ED6', id: u?.id }
  }

  function threadsOf(node: any): any[] {
    return (node?.comments?.toJSON?.() ?? []) as any[]
  }

  function addThread(node: any, offset: { x: number, y: number }, body: string): string {
    if (!node?.comments?.setProperty) {
      return '' // 宿主元素不支持评论（如根 Doc 非 Element2D）
    }
    const id = uid('t')
    node.comments.setProperty(id, {
      id,
      offset,
      resolved: false,
      messages: [{ id: uid('m'), author: author(), body, createdAt: Date.now() }],
    })
    bump()
    return id
  }

  // reply/resolve 共用：按 id 查到线程 → patch 合并 → 逐线程写回 → bump。
  function mutateThread(node: any, threadId: string, patch: (t: any) => any): void {
    const t = threadsOf(node).find(x => x.id === threadId)
    if (!t || !node?.comments?.setProperty) {
      return
    }
    node.comments.setProperty(threadId, patch(t))
    bump()
  }

  function reply(node: any, threadId: string, body: string): void {
    mutateThread(node, threadId, t => ({
      ...t,
      messages: [...(t.messages ?? []), { id: uid('m'), author: author(), body, createdAt: Date.now() }],
    }))
  }

  function resolve(node: any, threadId: string, resolved: boolean): void {
    mutateThread(node, threadId, t => ({ ...t, resolved }))
  }

  function remove(node: any, threadId: string): void {
    node.comments.setProperty(threadId, undefined)
    bump()
  }

  // 坐标换算复用核心 box mixin 的点级方法，避免与引擎各处公式重复。
  const toScreen = editor.globalToDrawboard
  const toWorld = editor.drawboardToGlobal

  return { threads, addThread, reply, resolve, remove, toScreen, toWorld }
}

/** 组件内读取评论数据层。 */
export function useComments(): CommentsApi {
  const editor = useEditor()
  const api = (editor as any).comments as CommentsApi | undefined
  if (!api) {
    throw new Error('[mce] comments plugin is not installed')
  }
  return api
}
