<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue'
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
} = useEditor()

const model = defineModel<boolean>()
const position = defineModel<{ x: number, y: number }>('position', {
  default: () => ({ x: 0, y: 0 }),
})
const menuRef = useTemplateRef('menuTplRef')

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

function onClickItem(item: any) {
  const key = item.key
  const [name, ...params] = key.split(':')
  ;(exec as any)(name, ...params)
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
      <span class="mce-context-menu__title">{{ t(item.key) }}</span>
      <span v-if="hotkeys.has(item.key)" class="mce-context-menu__kbd">{{ getKbd(item.key) }}</span>
    </template>
  </Menu>
</template>

<style lang="scss">
.mce-context-menu {
  &__title {
    flex: 1;
  }

  &__kbd {
    margin-left: 24px;
    opacity: .3;
  }
}
</style>
