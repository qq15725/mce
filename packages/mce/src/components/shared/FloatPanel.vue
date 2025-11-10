<script setup lang="ts">
import type { OrientedBoundingBox } from '../../types'
import { ref } from 'vue'
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import Transformable from './Transformable.vue'

const props = defineProps<{
  title?: string
  defaultTransform?: Partial<OrientedBoundingBox>
}>()

const isActive = defineModel<boolean>()

const transform = ref({
  width: 300,
  height: 600,
  left: 60,
  top: 60,
  ...props.defaultTransform,
})
</script>

<template>
  <Transformable
    v-slot="{ props: slotProps }"
    v-model="transform"
    class="mce-float-panel"
    visibility="none"
    @wheel.stop
  >
    <div
      class="mce-float-panel__card"
      v-bind="slotProps"
    >
      <div v-if="title" class="mce-float-panel__title">
        <div>{{ title }}</div>
        <Btn @click="isActive = false">
          <Icon icon="$close" />
        </Btn>
      </div>

      <div
        class="mce-float-panel__content"
        @pointerdown.stop
      >
        <slot />
      </div>
    </div>
  </Transformable>
</template>

<style lang="scss">
  .mce-float-panel {
    position: absolute;
    pointer-events: auto !important;

    &__card {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      background-color: rgb(var(--mce-theme-surface));
      box-shadow: var(--mce-shadow);
      overflow: hidden;
    }

    &__title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      font-size: 12px;
      font-weight: bold;
      border-bottom: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }

    &__content {
      position: relative;
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }
  }
</style>
