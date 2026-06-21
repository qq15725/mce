<script lang="ts" setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { useOverlay } from '../../composables'

const props = defineProps({
  /** 持久化：点击遮罩 / 按 Esc 不关闭。 */
  persistent: {
    type: Boolean,
    default: false,
  },
  /** 对话框宽度（CSS 值），默认自适应内容。 */
  width: {
    type: String,
    default: undefined,
  },
  /** Teleport 目标。默认挂到编辑器 overlay 容器（继承风格变量），否则 body。 */
  attach: {
    type: [String, Object, Boolean] as unknown as () => string | HTMLElement | false,
    default: undefined,
  },
})

const isActive = defineModel<boolean>({ default: false })

// 默认挂到编辑器 overlay 容器（位于 .m-editor 内，可继承 --m-theme-* 风格变量）；
// 若不在编辑器上下文则回退 body。
const overlayItem = useOverlay()
const attachTarget = computed(() => props.attach ?? overlayItem.attach?.value ?? 'body')

function close(): void {
  if (props.persistent) {
    return
  }
  isActive.value = false
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && isActive.value) {
    e.stopPropagation()
    close()
  }
}

watch(isActive, (on) => {
  if (on) {
    window.addEventListener('keydown', onKeydown, true)
  }
  else {
    window.removeEventListener('keydown', onKeydown, true)
  }
}, { immediate: true })

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <slot
    name="activator"
    :props="{ onClick: () => (isActive = true) }"
    :is-active="isActive"
  />

  <Teleport
    :disabled="attachTarget === false"
    :to="typeof attachTarget === 'boolean' ? undefined : attachTarget"
  >
    <Transition name="m-dialog">
      <div
        v-if="isActive"
        class="m-dialog"
        @pointerdown.self="close"
      >
        <div class="m-dialog__scrim" @pointerdown.self="close" />
        <div
          class="m-dialog__panel"
          role="dialog"
          aria-modal="true"
          :style="{ width }"
          @pointerdown.stop
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.m-dialog {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;

  &__scrim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, .35);
  }

  &__panel {
    position: relative;
    max-width: 92vw;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    background: rgb(var(--m-theme-surface, 255 255 255));
    color: rgb(var(--m-theme-on-surface, 30 30 30));
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
    overflow: hidden;
  }

  // —— 过渡动画：遮罩淡入 + 面板上浮缩放 ——
  &-enter-active,
  &-leave-active {
    transition: opacity .18s ease;

    .m-dialog__panel {
      transition: transform .2s cubic-bezier(.2, .8, .2, 1);
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .m-dialog__panel {
      transform: translateY(12px) scale(.96);
    }
  }
}
</style>
