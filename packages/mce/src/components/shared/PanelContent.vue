<script setup lang="ts">
import { Icon } from '../icon'
import Btn from './Btn.vue'

// 面板统一外观：标题栏（可拖拽来源 / 可关闭）+ 可滚动内容区。
// 仅负责「面板内部 chrome」，浮动 / 停靠等定位行为由外层容器（FloatPanel / LayoutItem）负责。
withDefaults(defineProps<{
  title?: string
  /** 是否显示关闭按钮（点击触发 close）。 */
  closable?: boolean
  /** 内容区是否加统一内边距（默认不加，由各面板自管）。 */
  padded?: boolean
}>(), {
  closable: false,
  padded: false,
})

const emit = defineEmits<{
  close: []
  /** 标题栏按下（供外层实现拖拽）。 */
  headerPointerdown: [event: PointerEvent]
}>()
</script>

<template>
  <div class="m-panel">
    <div
      v-if="title || closable"
      class="m-panel__header"
      @pointerdown="(e: PointerEvent) => emit('headerPointerdown', e)"
    >
      <div class="m-panel__title">
        {{ title }}
      </div>
      <Btn v-if="closable" icon @pointerdown.stop @click="emit('close')">
        <Icon icon="$close" />
      </Btn>
    </div>

    <div
      class="m-panel__body"
      :class="{ 'm-panel__body--padded': padded }"
      @pointerdown.stop
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss">
  .m-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    color: rgb(var(--m-theme-on-surface));

    &__header {
      flex: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      font-size: 0.75rem;
      font-weight: bold;
      border-bottom: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      user-select: none;
    }

    &__title {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &__body {
      position: relative;
      flex: 1 1 auto;
      width: 100%;
      min-height: 0;
      overflow-y: auto;

      &--padded {
        padding: 8px;
      }
    }
  }
</style>
