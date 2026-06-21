<script lang="ts" setup>
import type { CommentThreadView } from './useComments'
import { useEditor } from 'mce'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useComments } from './useComments'

const { activeTool, activateTool, drawboardAabb, getAabb, root, t } = useEditor()
const comments = useComments()

// 评论是工具：activeTool==='comment' 即处于评论态（与移动等单选互斥）。
const isComment = computed(() => activeTool.value?.name === 'comment')

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

// —— 新建草稿（点击放置）——
const draft = ref<{ node: any, offset: { x: number, y: number }, world: { x: number, y: number }, text: string }>()
const draftPos = computed(() => (draft.value ? comments.toScreen(draft.value.world) : null))
const draftInput = ref<HTMLTextAreaElement>()

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
}

function submitReply(): void {
  const th = activeThread.value
  if (!th || !replyText.value.trim()) {
    return
  }
  comments.reply(th.node, th.id, replyText.value.trim())
  replyText.value = ''
}

function toggleResolve(): void {
  const th = activeThread.value
  if (!th) {
    return
  }
  comments.resolve(th.node, th.id, !th.resolved)
  activeId.value = undefined
}

function removeThread(): void {
  const th = activeThread.value
  if (!th) {
    return
  }
  comments.remove(th.node, th.id)
  activeId.value = undefined
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

// Esc 链式退出：关草稿 → 关弹窗 → 退出评论模式。
function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape') {
    return
  }
  if (draft.value) {
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
      {{ initial(p.thread.messages[0]?.author?.name) }}
      <span v-if="p.thread.messages.length > 1" class="m-comments__pin-count">
        {{ p.thread.messages.length }}
      </span>
    </button>

    <!-- 线程弹窗 -->
    <div
      v-if="activeThread && activePos"
      class="m-comments__panel"
      :style="{ left: `${activePos.x + 16}px`, top: `${activePos.y}px` }"
      @pointerdown.stop
    >
      <button
        type="button"
        class="m-comments__close"
        :title="t('comment:close')"
        @click="activeId = undefined"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>

      <div class="m-comments__list">
        <div v-for="c in activeThread.messages" :key="c.id" class="m-comments__item">
          <span class="m-comments__avatar" :style="{ backgroundColor: c.author?.color ?? '#1C7ED6' }">
            {{ initial(c.author?.name) }}
          </span>
          <div class="m-comments__bubble">
            <div class="m-comments__meta">
              <span class="m-comments__name">{{ c.author?.name }}</span>
              <span class="m-comments__time">{{ fmtTime(c.createdAt) }}</span>
            </div>
            <div class="m-comments__text">
              {{ c.body }}
            </div>
          </div>
        </div>
      </div>

      <div class="m-comments__reply">
        <input
          v-model="replyText"
          class="m-comments__input"
          :placeholder="t('comment:reply')"
          @keydown.enter="submitReply"
          @pointerdown.stop
        >
      </div>

      <div class="m-comments__actions">
        <button type="button" class="m-comments__btn" @click="removeThread">
          {{ t('comment:delete') }}
        </button>
        <button type="button" class="m-comments__btn m-comments__btn--primary" @click="toggleResolve">
          {{ activeThread.resolved ? t('comment:reopen') : t('comment:resolve') }}
        </button>
      </div>
    </div>

    <!-- 新建草稿 -->
    <div
      v-if="draft && draftPos"
      class="m-comments__panel m-comments__panel--draft"
      :style="{ left: `${draftPos.x + 16}px`, top: `${draftPos.y}px` }"
      @pointerdown.stop
    >
      <button
        type="button"
        class="m-comments__close"
        :title="t('comment:close')"
        @click="draft = undefined"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>

      <textarea
        ref="draftInput"
        v-model="draft.text"
        class="m-comments__textarea"
        :placeholder="t('comment:placeholder')"
        @keydown.enter.exact.prevent="submitDraft"
      />
      <div class="m-comments__actions">
        <button
          type="button"
          class="m-comments__btn m-comments__btn--primary"
          :disabled="!draft.text.trim()"
          @click="submitDraft"
        >
          {{ t('comment') }}
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

    &--active {
      outline: 2px solid rgba(var(--m-theme-primary), .6);
      outline-offset: 1px;
    }
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
    width: 280px;
    background: rgb(var(--m-theme-surface));
    color: rgb(var(--m-theme-on-surface));
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, .2), 0 0 0 1px rgba(var(--m-theme-on-surface), .06);
    overflow: hidden;
  }

  &__close {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
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
    max-height: 280px;
    overflow-y: auto;
    padding: 14px 12px 4px;
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
  }

  &__bubble {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: baseline;
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

  &__text {
    font-size: 0.8125rem;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
  }

  &__reply {
    padding: 4px 12px 8px;
  }

  &__input,
  &__textarea {
    width: 100%;
    border: 1px solid rgba(var(--m-theme-on-surface), .14);
    border-radius: 8px;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 0.8125rem;
    padding: 8px 10px;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: rgb(var(--m-theme-primary));
    }
  }

  &__textarea {
    resize: none;
    height: 64px;
  }

  &__panel--draft {
    padding: 30px 10px 10px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 12px 12px;

    .m-comments__panel--draft & {
      padding: 8px 0 0;
    }
  }

  &__btn {
    border: 1px solid rgba(var(--m-theme-on-surface), .14);
    background: none;
    color: inherit;
    border-radius: 7px;
    padding: 0 12px;
    height: 30px;
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

    &:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
  }
}
</style>
