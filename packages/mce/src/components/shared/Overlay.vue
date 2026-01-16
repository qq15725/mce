<script setup lang="ts">
import type { Fn } from '@vueuse/core'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/vue'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { makeMceOverlayProps, useOverlay } from '../../composables'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  ...makeMceOverlayProps(),
  modelValue: Boolean,
})

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'click:outside': [event: MouseEvent]
}>()

const overlayItem = useOverlay()
const isActive = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})
const activatorEl = ref<any>()
const virtualElement = {
  getBoundingClientRect() {
    const { x = 0, y = 0 } = props.target as any
    return {
      x,
      y,
      left: x,
      top: y,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
    }
  },
}
const target = computed(() => {
  if (
    typeof props.target === 'object'
    && !('getBoundingClientRect' in props.target)
    && !(props.target instanceof Element)
    && 'x' in props.target
    && 'y' in props.target
  ) {
    return virtualElement
  }
  return props.target ?? activatorEl.value
})
const contentEl = useTemplateRef('contentElTpl')
const attach = computed(() => props.attach ?? overlayItem.attach?.value ?? 'body')

const middlewares = new Set(props.middlewares)

const { floatingStyles, update } = useFloating(target, contentEl, {
  placement: computed(() => props.location),
  whileElementsMounted: autoUpdate,
  middleware: [
    middlewares.has('offset') && offset(() => props.offset ?? 0),
    middlewares.has('flip') && flip(),
    middlewares.has('shift') && shift({ padding: 20 }),
  ].filter(Boolean) as any[],
})

const style = computed(() => {
  return {
    zIndex: 1500 + overlayItem.index.value,
  }
})

const contentStyle = computed(() => {
  console.log({
    ...floatingStyles.value,
    ...props.contentStyle,
  })
  return {
    ...floatingStyles.value,
    ...props.contentStyle,
  }
})

const activatorProps = computed(() => {
  return {
    ref: (el: any) => activatorEl.value = el,
  }
})

let clearup: Fn[] = []

onMounted(() => {
  const { trigger, stop } = onClickOutside(
    contentEl,
    (e) => {
      if (isActive.value) {
        isActive.value = false
        emit('click:outside', e as any)
      }
    },
    {
      controls: true,
      ignore: computed(() => [
        contentEl.value,
        activatorEl.value,
      ]),
    },
  ) as any

  clearup = [
    stop,
    useEventListener('pointerdown', trigger, { passive: true, capture: true }),
  ]
})

onBeforeUnmount(() => clearup.forEach(cb => cb()))

defineExpose({
  activatorEl,
  target,
  contentEl,
  updateLocation: update,
})
</script>

<template>
  <slot
    name="activator"
    :props="activatorProps"
    :is-active="isActive"
  />

  <Teleport
    :disabled="attach === false"
    :to="typeof attach === 'boolean' ? undefined : attach"
  >
    <div
      v-if="isActive"
      class="mce-overlay"
      :style="style"
      v-bind="$attrs"
    >
      <div
        ref="contentElTpl"
        :style="contentStyle"
        class="mce-overlay-content"
        :class="props.contentClass"
      >
        <slot name="default" />
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
.mce-overlay {
  position: absolute;
  display: flex;
  inset: 0;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
}
</style>
