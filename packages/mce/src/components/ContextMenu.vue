<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import { useEditor } from '../composables/editor'
import Menu from './shared/Menu.vue'

const {
  drawboardDom,
  drawboardAabb,
  contextMenu,
  exec,
  getKbd,
  t,
  hotkeys,
  registerCommand,
  unregisterCommand,
} = useEditor()

const model = defineModel<boolean>()
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

function updateLocation() {
  menuRef.value?.updateLocation()
}

function onContextmenu(e: MouseEvent) {
  e.preventDefault()
  model.value = true
  position.value = {
    x: e.clientX,
    y: e.clientY,
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
    v-model="model"
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
