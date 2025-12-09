<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import { useEditor } from '../composables/editor'
import Menu from './shared/Menu.vue'

const {
  drawboardDom,
  drawboardAabb,
  drawboardContextMenuPointer,
  contextMenu,
  exec,
  getKbd,
  t,
  hotkeys,
  registerCommand,
  unregisterCommand,
} = useEditor()

const isActive = defineModel<boolean>()
const position = defineModel<{ x: number, y: number }>('position', {
  default: () => ({ x: 0, y: 0 }),
})
const menuRef = useTemplateRef('menuTplRef')

onBeforeMount(() => {
  registerCommand({ command: 'openContextMenu', handle: onContextmenu })
})

onBeforeUnmount(() => {
  unregisterCommand('openContextMenu')
})

watch(isActive, (isActive) => {
  if (!isActive) {
    drawboardContextMenuPointer.value = undefined
  }
})

function updateLocation() {
  menuRef.value?.updateLocation()
}

function onContextmenu(event: MouseEvent) {
  event.preventDefault()
  isActive.value = true
  position.value = {
    x: event.clientX,
    y: event.clientY,
  }
  drawboardContextMenuPointer.value = {
    x: event.clientX - drawboardAabb.value.left,
    y: event.clientY - drawboardAabb.value.top,
  }
  updateLocation()
}

watch(drawboardDom, (el, old) => {
  old?.removeEventListener('contextmenu', onContextmenu)
  el?.addEventListener('contextmenu', onContextmenu)
}, { immediate: true })

onBeforeUnmount(() => {
  drawboardDom.value?.removeEventListener('contextmenu', onContextmenu)
})

function onClickItem(item: Mce.MenuItem) {
  ;(exec as any)(item.key)
}

defineExpose({
  updateLocation,
})
</script>

<template>
  <Menu
    ref="menuTplRef"
    v-model="isActive"
    :offset="10"
    class="mce-context-menu"
    :target="position"
    location="bottom-start"
    :items="contextMenu"
    :style="{
      maxHeight: `${drawboardAabb.height * .8}px`,
    }"
    @click:item="onClickItem"
  >
    <template #title="{ item }">
      {{ t(item.key) }}
    </template>

    <template #kbd="{ item }">
      <template v-if="hotkeys.has(item.key)">
        {{ getKbd(item.key) }}
      </template>
    </template>
  </Menu>
</template>

<style lang="scss">
.mce-context-menu {
  //
}
</style>
