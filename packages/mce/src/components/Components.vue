<script setup lang="ts">
import type { ComponentDef } from '../utils'
import { onMounted, onUnmounted, ref } from 'vue'
import { useEditor } from '../composables/editor'

const editor = useEditor()
const components = ref<ComponentDef[]>([])

function refresh(): void {
  components.value = editor.exec('getComponents') ?? []
}

function instantiate(def: ComponentDef): void {
  const aabb = editor.viewportAabb.value
  editor.exec('createInstance', def.id, {
    position: { x: aabb.left + aabb.width / 2, y: aabb.top + aabb.height / 2 },
    active: true,
  })
}

function remove(def: ComponentDef): void {
  editor.exec('removeComponent', def.id)
  refresh()
}

// 组件库写入 root.meta 经事务，会触发 historyChanged —— 据此刷新面板。
onMounted(() => {
  refresh()
  editor.on('historyChanged', refresh)
})
onUnmounted(() => {
  editor.off('historyChanged', refresh)
})
</script>

<template>
  <div class="mce-components">
    <div v-if="!components.length" class="mce-components__empty">
      {{ editor.t('components.empty') }}
    </div>
    <div
      v-for="def in components"
      :key="def.id"
      class="mce-components__item"
      :title="def.name"
      @click="instantiate(def)"
    >
      <span class="mce-components__name">{{ def.name || 'Component' }}</span>
      <button class="mce-components__remove" @click.stop="remove(def)">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.mce-components {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  overflow: auto;
}
.mce-components__empty {
  padding: 16px 8px;
  color: var(--mce-color-text-secondary, #999);
  font-size: 12px;
  text-align: center;
}
.mce-components__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  user-select: none;
}
.mce-components__item:hover {
  background: var(--mce-color-hover, rgb(0 0 0 / 6%));
}
.mce-components__name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mce-components__remove {
  flex: none;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0;
}
.mce-components__item:hover .mce-components__remove {
  opacity: 0.6;
}
.mce-components__remove:hover {
  opacity: 1;
  background: var(--mce-color-hover, rgb(0 0 0 / 10%));
}
</style>
