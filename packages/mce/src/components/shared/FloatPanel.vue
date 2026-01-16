<script setup lang="ts">
import type { OrientedBoundingBox } from '../../types'
import { ref } from 'vue'
import { Icon } from '../icon'
import Btn from './Btn.vue'
import TransformControls from './TransformControls.vue'

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

const defaultSlotProps = {
  isActive,
}
</script>

<template>
  <TransformControls
    v-slot="{ props: slotProps }"
    v-model="transform"
    class="mce-float-panel"
    hide-ui
    @wheel.stop
  >
    <div
      class="mce-float-panel__card"
      v-bind="slotProps"
    >
      <div v-if="title" class="mce-float-panel__title">
        <div>{{ title }}</div>
        <Btn icon @click="isActive = false">
          <Icon icon="$close" />
        </Btn>
      </div>

      <div
        class="mce-float-panel__content"
        @pointerdown.stop
      >
        <slot v-bind="defaultSlotProps" />
      </div>
    </div>
  </TransformControls>
</template>

<style lang="scss">
  .mce-float-panel {
    position: absolute;
    pointer-events: auto !important;
    z-index: 2000;

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
      font-size: 0.75rem;
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
