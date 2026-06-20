<script setup lang="ts">
import type { EditorComponent } from '../editor'
import { h } from 'vue'
import { useEditor } from '../composables/editor'
import FloatPanel from './shared/FloatPanel.vue'
import LayoutItem from './shared/LayoutItem.vue'

// 由 EditorLayout 传入其具名插槽，供带 `slot` 的组件（如 selection overlay）转发。
const props = defineProps<{
  slots: Record<string, any>
}>()

const {
  sortedComponents,
  componentRefs,
  drawboardDom,
  drawboardAabb,
  screenCenterOffset,
  t,
} = useEditor()

function setComponentRef(ref: any, item: EditorComponent): void {
  if (!componentRefs[item.plugin]) {
    componentRefs[item.plugin] = []
  }
  componentRefs[item.plugin][item.indexInPlugin] = ref
}

function RenderComponent(componentProps: Record<string, any> & { item: EditorComponent }) {
  const { item, ...resetProps } = componentProps
  const itemSlots: Record<string, any> = {}
  if (item.slot) {
    Object.keys(props.slots).forEach((key) => {
      if (key === item.slot) {
        itemSlots.default = props.slots[key]
      }
      else if (key.startsWith(`${item.slot}.`)) {
        itemSlots[key.substring(`${item.slot}.`.length)] = props.slots[key]
      }
    })
  }
  return h(item.component, {
    ...resetProps,
    ref: (v: any) => setComponentRef(v, item),
  }, itemSlots)
}
</script>

<template>
  <template
    v-for="(item, key) in sortedComponents"
    :key="key"
  >
    <template v-if="item.type === 'overlay'">
      <Teleport
        v-if="drawboardDom && item.visible.value"
        :to="drawboardDom"
      >
        <RenderComponent :item="item" />
      </Teleport>
    </template>

    <template v-else-if="item.type === 'panel'">
      <template v-if="item.position === 'float'">
        <FloatPanel
          v-if="drawboardAabb.height && item.visible.value"
          v-model="item.visible.value"
          :name="item.name"
          :title="t(item.name)"
          :default-transform="{
            width: item.size || 260,
            height: drawboardAabb.height * .7,
            left: drawboardAabb.left + (screenCenterOffset.left + 24),
            top: drawboardAabb.top + (screenCenterOffset.top + 24),
          }"
        >
          <template #default="{ isActive }">
            <RenderComponent
              v-model:is-active="isActive.value"
              :item="item"
            />
          </template>
        </FloatPanel>
      </template>

      <template v-else>
        <LayoutItem
          v-if="item.visible.value"
          v-model="item.visible.value"
          :name="item.name"
          :position="item.position as any"
          :size="item.size || 200"
          :order="item.order || 0"
          :resizable="(item as any).resizable !== false"
          :min-size="(item as any).minSize"
          :max-size="(item as any).maxSize"
        >
          <RenderComponent :item="item" />
        </LayoutItem>
      </template>
    </template>
  </template>
</template>
