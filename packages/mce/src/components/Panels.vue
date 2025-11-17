<script setup lang="ts">
import { useEditor } from '../composables/editor'
import FloatPanel from './shared/FloatPanel.vue'

const {
  config,
  typedPlugins,
  screenCenterOffset,
  drawboardAabb,
  t,
} = useEditor()
</script>

<template>
  <div class="mce-panels">
    <template
      v-for="(p, key) in typedPlugins.panel" :key="key"
    >
      <FloatPanel
        v-if="(config as any)[p.name]"
        v-model="(config as any)[p.name]"
        :title="t(p.name)"
        :default-transform="{
          width: 240,
          height: drawboardAabb.height * .7,
          top: screenCenterOffset.top + 24,
          left: screenCenterOffset.left + 24,
        }"
      >
        <Component :is="p.component" />
      </FloatPanel>
    </template>
  </div>
</template>
