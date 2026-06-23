<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useEditor } from '../composables'
import { Icon } from './icon'
import Dialog from './shared/Dialog.vue'

// 快捷键参考面板：列出全部已注册快捷键，按类别分组、可搜索。
// 数据来自 editor.hotkeysData（命令 + 按键），按键显示用 getKbd，文案用 t()。
const { hotkeysData, getKbd, t, exec } = useEditor()

const query = ref('')

// 显隐与 ui.shortcuts 配置同步（hotkey toggleUi:shortcuts 翻转它 → 本组件挂载/卸载）。
const open = computed<boolean>({
  get: () => Boolean(exec('isUiVisible', 'shortcuts')),
  set: v => exec('setUiVisible', 'shortcuts', v),
})

// 类别：按命令前缀 / 正则归类，优先级自上而下；未命中归入「其他」。
const CATEGORIES: { key: string, test: (c: string) => boolean }[] = [
  { key: 'shortcutsCatTools', test: c => /^(?:activateTool:|setState:)/.test(c) },
  { key: 'shortcutsCatView', test: c => /^(?:zoom|fit|toggleUi|togglePanel|scroll)/.test(c) },
  { key: 'shortcutsCatEdit', test: c => /^(?:copy|cut|paste|duplicate|delete|undo|redo|import|formatPaint)/.test(c) },
  { key: 'shortcutsCatSelection', test: c => c.startsWith('select') || c === 'enter' || c === 'cancel' },
  { key: 'shortcutsCatArrange', test: c => /^(?:align|distribute|bring|send|group|ungroup|frameSelection|flip|tidyUp|lockOrUnlock|showOrHide|move)/.test(c) },
  { key: 'shortcutsCatPlayback', test: c => /^(?:togglePlay|seek|step)/.test(c) },
  { key: 'shortcutsCatDocument', test: c => /^(?:newDoc|openDoc)/.test(c) },
]

function humanize(s: string): string {
  return s.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
}

// 文案：命令直查 > 复合命令取后缀直查 > 人性化兜底。
function labelOf(command: string): string {
  const direct = t(command)
  if (direct && direct !== command) {
    return direct
  }
  if (command.includes(':')) {
    const suffix = command.split(':').pop() as string
    const bySuffix = t(suffix)
    return bySuffix && bySuffix !== suffix ? bySuffix : humanize(suffix)
  }
  return humanize(command)
}

interface Row { command: string, label: string, kbd: string }

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const buckets = new Map<string, Row[]>()
  for (const hk of hotkeysData.value) {
    if (hk.enabled === false) {
      continue
    }
    const kbd = getKbd(hk.command)
    if (!kbd) {
      continue
    }
    const label = labelOf(hk.command)
    if (
      q
      && !label.toLowerCase().includes(q)
      && !kbd.toLowerCase().includes(q)
      && !hk.command.toLowerCase().includes(q)
    ) {
      continue
    }
    const cat = CATEGORIES.find(c => c.test(hk.command))?.key ?? 'shortcutsCatOther'
    if (!buckets.has(cat)) {
      buckets.set(cat, [])
    }
    buckets.get(cat)!.push({ command: hk.command, label, kbd })
  }
  const order = [...CATEGORIES.map(c => c.key), 'shortcutsCatOther']
  return order
    .filter(k => buckets.has(k))
    .map(k => ({
      key: k,
      title: t(k),
      rows: buckets.get(k)!.sort((a, b) => a.label.localeCompare(b.label)),
    }))
})
</script>

<template>
  <Dialog v-model="open" width="680px">
    <div class="m-shortcuts">
      <div class="m-shortcuts__head">
        <span class="m-shortcuts__title">{{ t('shortcuts') }}</span>
        <input
          v-model="query"
          class="m-shortcuts__search"
          type="text"
          :placeholder="t('shortcutsSearch')"
          spellcheck="false"
        >
        <button
          class="m-shortcuts__close"
          type="button"
          :title="t('close')"
          @click="open = false"
        >
          <Icon icon="$close" />
        </button>
      </div>

      <div class="m-shortcuts__body">
        <section
          v-for="g in groups"
          :key="g.key"
          class="m-shortcuts__group"
        >
          <h4 class="m-shortcuts__cat">
            {{ g.title }}
          </h4>
          <div
            v-for="row in g.rows"
            :key="row.command"
            class="m-shortcuts__row"
          >
            <span class="m-shortcuts__label">{{ row.label }}</span>
            <kbd class="m-shortcuts__kbd">{{ row.kbd }}</kbd>
          </div>
        </section>

        <div v-if="!groups.length" class="m-shortcuts__empty">
          {{ query }}
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style lang="scss">
  .m-shortcuts {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 0;
    font-size: 0.8125rem;

    &__head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
    }

    &__title {
      font-size: 0.9375rem;
      font-weight: 600;
      white-space: nowrap;
    }

    &__search {
      flex: 1;
      height: 28px;
      padding: 0 10px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font: inherit;

      &:focus {
        outline: none;
        border-color: rgb(var(--m-theme-primary));
      }
    }

    &__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: inherit;
      cursor: pointer;

      &:hover {
        background-color: rgba(var(--m-theme-on-surface), 0.08);
      }
    }

    &__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 8px 16px 16px;
      column-count: 2;
      column-gap: 28px;
    }

    &__group {
      break-inside: avoid;
      margin-top: 14px;
    }

    &__cat {
      margin: 0 0 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.5;
    }

    &__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      height: 28px;
    }

    &__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // 与 Menu 的 kbd 渲染一致：默认字体（等宽字体会把 ⌘⇧⌥⌃ 等修饰符渲染得发虚），
    // 字距 + 低透明度，右对齐。
    &__kbd {
      flex-shrink: 0;
      font-size: 0.75rem;
      white-space: nowrap;
      letter-spacing: 0.08em;
      text-align: right;
      opacity: 0.45;
    }

    &__empty {
      padding: 24px 0;
      text-align: center;
      opacity: 0.5;
    }
  }
</style>
