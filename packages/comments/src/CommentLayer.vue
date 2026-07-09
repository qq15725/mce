<script lang="ts" setup>
import type { CommentThreadView } from './useComments'
import { useEditor } from 'mce'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useComments } from './useComments'

const { activeTool, activateTool, drawboardAabb, getAabb, root, t, readonly } = useEditor()
const comments = useComments()

// 评论是工具：activeTool==='comment' 即处于评论态（与移动等单选互斥）。
const isComment = computed(() => activeTool.value?.name === 'comment')

const canComment = computed(() => !readonly.value)

// 当前用户 id：用于判断某条消息是否本人所发（从而显示编辑 / 删除）。
const meId = computed(() => comments.me().id)
function canManage(c: { author?: { id?: string } }): boolean {
  return !meId.value || meId.value === c.author?.id
}

// pin 定位依赖所属元素世界矩阵。订阅各所属元素的 updateGlobalTransform：元素自身变换改变即触发，
// 父级移动也会在引擎 _process 级联触发（仅真有变化才发，空闲不发），不蹭全局渲染帧。
// 相机平移缩放由 toScreen 读 camera 响应式自动跟随。
const transformTick = ref(0)
let unsubs: (() => void)[] = []

function resubscribe(): void {
  unsubs.forEach(u => u())
  unsubs = []
  const seen = new Set<any>()
  comments.threads.value
    .filter(th => !th.resolved)
    .forEach((th) => {
      const node = th.node
      if (!node?.on || seen.has(node)) {
        return
      }
      seen.add(node)
      const cb = (): void => {
        transformTick.value++
      }
      node.on('updateGlobalTransform', cb)
      unsubs.push(() => node.off('updateGlobalTransform', cb))
    })
}

watch(
  () => comments.threads.value.filter(th => !th.resolved).map(th => th.node?.id).join(','),
  () => nextTick(resubscribe),
  { immediate: true },
)
onBeforeUnmount(() => unsubs.forEach(u => u()))

/** 线程 → 画板屏幕坐标：所属元素局部 offset 经世界矩阵还原。读 transformTick 建立变换依赖。 */
function anchorScreen(thread: CommentThreadView): { x: number, y: number } | null {
  void transformTick.value
  const node = thread.node
  if (!node?.toGlobal) {
    return null // 元素已删除：暂不渲染
  }
  return comments.toScreen(node.toGlobal(thread.offset))
}

/** 命中：世界坐标落在哪个元素内（取最上层），无则归到根；返回所属节点 + 其局部 offset。 */
function ownerAt(world: { x: number, y: number }): { node: any, offset: { x: number, y: number } } {
  let hit: any
  const visit = (node: any): void => {
    node.children?.forEach((child: any) => {
      const ab = getAabb(child)
      if (ab.width && ab.height && ab.contains(world)) {
        hit = child
      }
      visit(child)
    })
  }
  visit(root.value)
  const node = hit ?? root.value
  const local = node.toLocal ? node.toLocal(world) : world
  return { node, offset: { x: local.x, y: local.y } }
}

const pins = computed(() =>
  comments.threads.value
    .filter(th => !th.resolved)
    .map(th => ({ thread: th, screen: anchorScreen(th) }))
    .filter((p): p is { thread: CommentThreadView, screen: { x: number, y: number } } => Boolean(p.screen)),
)

// —— 打开的线程 ——
const activeId = ref<string>()
const activeThread = computed(() => comments.threads.value.find(th => th.id === activeId.value))
const activePos = computed(() => (activeThread.value ? anchorScreen(activeThread.value) : null))
const replyText = ref('')
const replyInput = ref<HTMLTextAreaElement>()

// —— 消息级操作（⋯ 菜单 / 行内编辑）——
const menuId = ref<string>() // 打开 ⋯ 菜单的消息 id
const editingId = ref<string>() // 正在编辑的消息 id
const editingText = ref('')

// —— 新建草稿（点击放置）——
const draft = ref<{ node: any, offset: { x: number, y: number }, world: { x: number, y: number }, text: string }>()
const draftPos = computed(() => (draft.value ? comments.toScreen(draft.value.world) : null))
const draftInput = ref<HTMLTextAreaElement>()

/** textarea 随内容自增高（上限由 CSS max-height 控制）。 */
function autoGrow(el?: HTMLTextAreaElement | null): void {
  if (!el) {
    return
  }
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
function onInput(e: Event): void {
  autoGrow(e.target as HTMLTextAreaElement)
}

function clientToDrawboard(e: PointerEvent): { x: number, y: number } {
  return { x: e.clientX - drawboardAabb.value.left, y: e.clientY - drawboardAabb.value.top }
}

function onCatcherDown(e: PointerEvent): void {
  if (activeId.value) {
    activeId.value = undefined
    return
  }
  if (draft.value) {
    draft.value = undefined
    return
  }
  const world = comments.toWorld(clientToDrawboard(e))
  const { node, offset } = ownerAt(world)
  draft.value = { node, offset, world, text: '' }
  nextTick(() => draftInput.value?.focus())
}

function submitDraft(): void {
  const d = draft.value
  if (!d || !d.text.trim()) {
    return
  }
  const id = comments.addThread(d.node, d.offset, d.text.trim())
  draft.value = undefined
  if (id) {
    activeId.value = id // 创建后直接打开线程
  }
}

function openThread(id: string): void {
  draft.value = undefined
  activeId.value = activeId.value === id ? undefined : id
  replyText.value = ''
  menuId.value = undefined
  editingId.value = undefined
  nextTick(() => replyInput.value?.focus())
}

function submitReply(): void {
  const th = activeThread.value
  if (!th || !replyText.value.trim()) {
    return
  }
  comments.reply(th.node, th.id, replyText.value.trim())
  replyText.value = ''
  nextTick(() => autoGrow(replyInput.value))
}

function toggleResolve(): void {
  const th = activeThread.value
  if (!th) {
    return
  }
  comments.resolve(th.node, th.id, !th.resolved)
  activeId.value = undefined
}

// —— ⋯ 菜单：编辑 / 删除某条消息 ——
function toggleMenu(id: string): void {
  menuId.value = menuId.value === id ? undefined : id
}

function startEdit(c: { id: string, body: string }): void {
  menuId.value = undefined
  editingId.value = c.id
  editingText.value = c.body
  nextTick(() => {
    const el = document.querySelector<HTMLTextAreaElement>('.m-comments__edit-input')
    el?.focus()
    autoGrow(el)
  })
}

function submitEdit(): void {
  const th = activeThread.value
  if (!th || !editingId.value) {
    return
  }
  const body = editingText.value.trim()
  if (body) {
    comments.editMessage(th.node, th.id, editingId.value, body)
  }
  editingId.value = undefined
}

function cancelEdit(): void {
  editingId.value = undefined
}

function removeMessage(c: { id: string }): void {
  const th = activeThread.value
  if (!th) {
    return
  }
  menuId.value = undefined
  const isRoot = th.messages[0]?.id === c.id
  comments.removeMessage(th.node, th.id, c.id)
  if (isRoot) {
    activeId.value = undefined // 删根消息 = 删整线程 → 关闭面板
  }
}

function initial(name?: string): string {
  return (name || '?').trim().charAt(0).toUpperCase() || '?'
}

function fmtTime(ts?: number): string {
  if (!ts) {
    return ''
  }
  const d = new Date(ts)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// Esc 链式退出：退编辑 → 关菜单 → 关草稿 → 关弹窗 → 退出评论模式。
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape') {
    return
  }
  if (editingId.value) {
    editingId.value = undefined
  }
  else if (menuId.value) {
    menuId.value = undefined
  }
  else if (draft.value) {
    draft.value = undefined
  }
  else if (activeId.value) {
    activeId.value = undefined
  }
  else if (isComment.value) {
    activateTool(undefined)
  }
  else {
    return
  }
  e.stopPropagation()
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div class="m-comments">
    <!-- 评论模式下的全画板捕获层：点击空白起草新评论 -->
    <div
      v-if="isComment"
      class="m-comments__catcher"
      @pointerdown.self="onCatcherDown"
    />

    <!-- 评论 pin -->
    <button
      v-for="p in pins"
      :key="p.thread.id"
      type="button"
      class="m-comments__pin"
      :class="{ 'm-comments__pin--active': p.thread.id === activeId }"
      :style="{
        left: `${p.screen.x}px`,
        top: `${p.screen.y}px`,
        backgroundColor: p.thread.messages[0]?.author?.color ?? '#1C7ED6',
      }"
      :title="p.thread.messages[0]?.author?.name"
      @pointerdown.stop
      @click.stop="openThread(p.thread.id)"
    >
      <img
        v-if="p.thread.messages[0]?.author?.avatar"
        class="m-comments__pin-avatar"
        :src="p.thread.messages[0]!.author!.avatar"
        alt=""
      >
      <template v-else>
        {{ initial(p.thread.messages[0]?.author?.name) }}
      </template>
      <span v-if="p.thread.messages.length > 1" class="m-comments__pin-count">
        {{ p.thread.messages.length }}
      </span>
    </button>

    <!-- 线程弹窗（Figma 版式：顶部 resolve/关闭 · 消息列表(悬浮 ⋯) · 底部回复框内嵌发送） -->
    <div
      v-if="activeThread && activePos"
      class="m-comments__panel"
      :style="{ left: `${activePos.x + 16}px`, top: `${activePos.y}px` }"
      @pointerdown.stop
    >
      <div class="m-comments__head">
        <button
          v-if="canComment"
          type="button"
          class="m-comments__resolve"
          :class="{ 'm-comments__resolve--on': activeThread.resolved }"
          :title="activeThread.resolved ? t('comment:reopen') : t('comment:resolve')"
          @click="toggleResolve"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M8.5 12.2l2.4 2.4 4.6-4.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="m-comments__head-spacer" />
        <button
          type="button"
          class="m-comments__icon-btn"
          :title="t('comment:close')"
          @click="activeId = undefined"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="m-comments__list">
        <div
          v-for="(c, i) in activeThread.messages"
          :key="c.id"
          class="m-comments__item"
        >
          <span class="m-comments__avatar" :style="{ backgroundColor: c.author?.color ?? '#1C7ED6' }">
            <img v-if="c.author?.avatar" :src="c.author.avatar" alt="">
            <template v-else>{{ initial(c.author?.name) }}</template>
          </span>
          <div class="m-comments__bubble">
            <div class="m-comments__meta">
              <span class="m-comments__name">{{ c.author?.name }}</span>
              <span class="m-comments__time">{{ fmtTime(c.createdAt) }}</span>
              <button
                v-if="canComment && canManage(c) && editingId !== c.id"
                type="button"
                class="m-comments__more"
                :title="t('comment:more')"
                @click.stop="toggleMenu(c.id)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.6" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                  <circle cx="19" cy="12" r="1.6" fill="currentColor" />
                </svg>
              </button>
              <div v-if="menuId === c.id" class="m-comments__menu">
                <button type="button" class="m-comments__menu-item" @click="startEdit(c)">
                  {{ t('comment:edit') }}
                </button>
                <button type="button" class="m-comments__menu-item m-comments__menu-item--danger" @click="removeMessage(c)">
                  {{ i === 0 ? t('comment:delete') : t('comment:deleteReply') }}
                </button>
              </div>
            </div>

            <!-- 行内编辑 -->
            <template v-if="editingId === c.id">
              <textarea
                v-model="editingText"
                class="m-comments__input m-comments__edit-input"
                rows="1"
                @input="onInput"
                @keydown.enter.exact.prevent="submitEdit"
                @keydown.esc.stop.prevent="cancelEdit"
              />
              <div class="m-comments__edit-actions">
                <button type="button" class="m-comments__btn" @click="cancelEdit">
                  {{ t('comment:cancel') }}
                </button>
                <button type="button" class="m-comments__btn m-comments__btn--primary" @click="submitEdit">
                  {{ t('comment:save') }}
                </button>
              </div>
            </template>
            <div v-else class="m-comments__text">
              {{ c.body }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部：回复输入框 + 内嵌圆形发送按钮 -->
      <div v-if="canComment" class="m-comments__composer">
        <textarea
          ref="replyInput"
          v-model="replyText"
          class="m-comments__input"
          rows="1"
          :placeholder="t('comment:reply')"
          @input="onInput"
          @keydown.enter.exact.prevent="submitReply"
          @pointerdown.stop
        />
        <button
          type="button"
          class="m-comments__send"
          :disabled="!replyText.trim()"
          :title="t('comment:send')"
          @click="submitReply"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20V5M12 5l-6 6M12 5l6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- ⋯ 菜单外部点击关闭 -->
      <div v-if="menuId" class="m-comments__backdrop" @pointerdown.stop="menuId = undefined" />
    </div>

    <!-- 新建草稿：与回复同款输入框内嵌发送 -->
    <div
      v-if="draft && draftPos"
      class="m-comments__panel m-comments__panel--draft"
      :style="{ left: `${draftPos.x + 16}px`, top: `${draftPos.y}px` }"
      @pointerdown.stop
    >
      <div class="m-comments__composer">
        <textarea
          ref="draftInput"
          v-model="draft.text"
          class="m-comments__input"
          rows="1"
          :placeholder="t('comment:placeholder')"
          @input="onInput"
          @keydown.enter.exact.prevent="submitDraft"
        />
        <button
          type="button"
          class="m-comments__send"
          :disabled="!draft.text.trim()"
          :title="t('comment:send')"
          @click="submitDraft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20V5M12 5l-6 6M12 5l6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.m-comments {
  position: absolute;
  inset: 0;
  pointer-events: none;

  &__catcher {
    position: absolute;
    inset: 0;
    pointer-events: auto;
    // 评论态光标：与工具图标同一气泡轮廓路径，黑色填充 + 白描边作为光晕（任意背景可见），
    // 热点在气泡尾尖（左下）。
    cursor:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Cpath d='M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13,16H20V4H4V16H10Z' fill='black' stroke='white' stroke-width='1'/%3E%3C/svg%3E") 10 26,
      copy;
  }

  // pin：左下角为锚点（气泡尾巴指向锚点），故用 translate 偏移。
  // z-index 抬到工具栏(无 z-index)之上：catcher 不设 z-index 仍靠 DOM 顺序落在工具栏下。
  &__pin {
    position: absolute;
    z-index: 10;
    transform: translate(0, -100%);
    pointer-events: auto;
    width: 28px;
    height: 28px;
    border: 2px solid #fff;
    border-radius: 50% 50% 50% 2px;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .25);
    overflow: visible;

    &--active {
      outline: 2px solid rgba(var(--m-theme-primary), .6);
      outline-offset: 1px;
    }
  }

  &__pin-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50% 50% 50% 2px;
    object-fit: cover;
  }

  &__pin-count {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 8px;
    background: rgb(var(--m-theme-primary));
    color: rgb(var(--m-theme-on-primary));
    font-size: 0.5625rem;
    line-height: 15px;
    text-align: center;
  }

  &__panel {
    position: absolute;
    z-index: 11;
    pointer-events: auto;
    width: 300px;
    background: rgb(var(--m-theme-surface));
    color: rgb(var(--m-theme-on-surface));
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, .2), 0 0 0 1px rgba(var(--m-theme-on-surface), .06);
    overflow: hidden;
  }

  // 顶部工具条：resolve（左）· 关闭（右）
  &__head {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(var(--m-theme-on-surface), .06);
  }

  &__head-spacer {
    flex: 1;
  }

  &__resolve {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: rgba(var(--m-theme-on-surface), .55);
    cursor: pointer;

    &:hover {
      background: rgba(var(--m-theme-on-surface), .08);
      color: rgba(var(--m-theme-on-surface), .85);
    }

    &--on {
      color: #2f9e44;

      &:hover {
        color: #2f9e44;
      }
    }
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: none;
    color: rgba(var(--m-theme-on-surface), .45);
    cursor: pointer;

    &:hover {
      background: rgba(var(--m-theme-on-surface), .08);
      color: rgba(var(--m-theme-on-surface), .8);
    }
  }

  &__list {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px 12px 4px;
  }

  &__item {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__avatar {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__bubble {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__name {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  &__time {
    font-size: 0.6875rem;
    color: rgba(var(--m-theme-on-surface), .45);
  }

  // ⋯ 更多：默认隐藏，悬浮该条消息时显示（Figma 手法）
  &__more {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: none;
    color: rgba(var(--m-theme-on-surface), .5);
    cursor: pointer;
    opacity: 0;

    &:hover {
      background: rgba(var(--m-theme-on-surface), .08);
      color: rgba(var(--m-theme-on-surface), .85);
    }
  }

  &__item:hover &__more {
    opacity: 1;
  }

  &__menu {
    position: absolute;
    top: 22px;
    right: 0;
    z-index: 2;
    min-width: 120px;
    padding: 4px;
    background: rgb(var(--m-theme-surface));
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, .22), 0 0 0 1px rgba(var(--m-theme-on-surface), .08);
  }

  &__menu-item {
    display: block;
    width: 100%;
    padding: 7px 10px;
    border: none;
    border-radius: 5px;
    background: none;
    color: rgb(var(--m-theme-on-surface));
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: rgba(var(--m-theme-on-surface), .08);
    }

    &--danger {
      color: #e03131;
    }
  }

  &__text {
    font-size: 0.8125rem;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
  }

  &__edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 6px;
  }

  // 底部回复：输入框 + 内嵌圆形发送按钮
  &__composer {
    position: relative;
    padding: 8px 12px 12px;
  }

  &__input {
    display: block;
    width: 100%;
    max-height: 120px;
    min-height: 38px;
    border: 1px solid rgba(var(--m-theme-on-surface), .14);
    border-radius: 10px;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.4;
    padding: 9px 40px 9px 12px;
    resize: none;
    outline: none;
    box-sizing: border-box;
    overflow-y: auto;

    &:focus {
      border-color: rgb(var(--m-theme-primary));
    }
  }

  &__edit-input {
    padding-right: 12px;
  }

  &__send {
    position: absolute;
    right: 20px;
    bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgb(var(--m-theme-primary));
    color: rgb(var(--m-theme-on-primary));
    cursor: pointer;
    transition: opacity .15s, background .15s;

    &:hover {
      filter: brightness(0.94);
    }

    &:disabled {
      background: rgba(var(--m-theme-on-surface), .12);
      color: rgba(var(--m-theme-on-surface), .4);
      cursor: not-allowed;
    }
  }

  &__btn {
    border: 1px solid rgba(var(--m-theme-on-surface), .14);
    background: none;
    color: inherit;
    border-radius: 7px;
    padding: 0 12px;
    height: 28px;
    font-size: 0.8125rem;
    cursor: pointer;

    &:not(.m-comments__btn--primary):hover {
      background: rgba(var(--m-theme-on-surface), .05);
      border-color: rgba(var(--m-theme-on-surface), .24);
    }

    &--primary {
      border: none;
      background: rgb(var(--m-theme-primary));
      color: rgb(var(--m-theme-on-primary));
      font-weight: 600;

      &:hover {
        filter: brightness(0.92);
      }
    }
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 1;
  }
}
</style>
