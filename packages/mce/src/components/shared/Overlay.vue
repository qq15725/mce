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
import { makeMceOverlayProps, useOverlay } from '../../composables/overlay'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  ...makeMceOverlayProps(),
})

const emit = defineEmits<{
  'click:outside': [event: MouseEvent]
  'update:modelValue': [val: boolean]
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

const { floatingStyles, update } = useFloating(target, contentEl, {
  placement: computed(() => props.location),
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(() => props.offset ?? 0),
    flip(),
    shift({ padding: 20 }),
  ],
})

const style = computed(() => {
  return {
    ...floatingStyles.value,
    zIndex: 2000 + overlayItem.index.value,
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
    { controls: true },
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
      ref="contentElTpl"
      class="mce-overlay"
      :style="style"
      v-bind="$attrs"
    >
      <slot name="default" />
    </div>
  </Teleport>
</template>

<style lang="scss">
.mce-overlay {
  & > * {
    pointer-events: auto;
  }
}
</style>
