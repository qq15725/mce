<script setup lang="ts">
import type { Node } from 'modern-canvas'
import type { PropType } from 'vue'
import { Element2D } from 'modern-canvas'
import { computed, createElementVNode, createVNode, defineComponent, mergeProps, ref } from 'vue'
import { useEditor } from '../composables/editor'
import Icon from './shared/Icon.vue'

const {
  root,
  selection,
} = useEditor()

const opened = defineModel<boolean>('opened', { default: true })

const Layer = defineComponent({
  name: 'MceLayer',
  inheritAttrs: false,
  props: {
    node: {
      type: Object as PropType<Node>,
      required: true,
    },
    opened: {
      type: Boolean,
      default: undefined,
    },
  },
  emits: ['update:opened'],
  setup(props, { attrs, emit }) {
    const _opened = ref(false)
    const opened = computed({
      get: () => props.opened !== undefined ? props.opened! : _opened.value,
      set: (v: boolean) => {
        if (props.opened !== undefined) {
          emit('update:opened', v)
        }
        else {
          _opened.value = v
        }
      },
    })

    const isActive = computed(() => selection.value.some(v => v.equal(props.node)))

    const children = computed<Node[]>(() => props.node?.children ?? [])

    function onClickPrepend() {
      opened.value = !opened.value
    }

    function onClickContent() {
      if (props.node instanceof Element2D) {
        selection.value = [props.node]
      }
    }

    return (): any => {
      function thumbnail() {
        const node = props.node
        if (node.meta.inEditorIs === 'Frame') {
          return createVNode(Icon, { icon: '$frame' })
        }
        if (node.children.length > 0) {
          return createVNode(Icon, { icon: '$group' })
        }
        if (node instanceof Element2D) {
          if (node.foreground.isValid() && node.foreground.image) {
            return createVNode('img', { src: node.foreground.image })
          }
          if (node.text.isValid()) {
            return createVNode(Icon, { icon: '$text' })
          }
        }
        return createVNode(Icon, { icon: '$shape' })
      }

      return createElementVNode(
        'div',
        mergeProps(attrs, {
          class: [
            'mce-layer',
            isActive.value && 'mce-layer--active',
          ],
        }),
        [
          createElementVNode('div', {
            class: 'mce-layer-item',
          }, [
            createElementVNode('div', {
              class: 'mce-layer-item__prepend',
              onClick: onClickPrepend,
            }, [
              children.value.length
                ? createVNode(Icon, { icon: '$arrowRight' })
                : undefined,
            ]),
            createElementVNode('div', {
              class: 'mce-layer-item__content',
              onClick: onClickContent,
            }, [
              createElementVNode('div', { class: 'mce-layer-item__thumbnail' }, [
                thumbnail(),
              ]),
              createElementVNode('div', { class: 'mce-layer-item__name' }, [
                props.node.name,
              ]),
            ]),
            createElementVNode('div', { class: 'mce-layer-item__append' }, [
              //
            ]),
          ]),
          ...(
            opened.value
              ? children.value.map(child => createVNode(Layer, { node: child }))
              : []
          ),
        ],
      )
    }
  },
})
</script>

<template>
  <Layer
    v-model:opened="opened"
    class="mce-layers"
    :node="root"
  />
</template>

<style lang="scss">
  .mce-layer-item {
    display: flex;
    align-items: center;
    height: 32px;
    font-size: 12px;
    border-radius: 4px;

    &:hover {
      background-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
    }

    &__prepend {
      display: flex;
      align-items: center;
      width: 16px;
      height: 100%;
      opacity: 0;
    }

    &__content {
      flex: 1;
      display: flex;
      align-items: center;
      height: 100%;
    }

    &__thumbnail {
      display: flex;
      align-items: center;
      width: 12px;
      height: 100%;
      font-size: 12px;
      overflow: hidden;

      img {
        display: block;
        width: 100%;
      }
    }

    &__name {
      padding-left: 8px;
    }
  }

  .mce-layers {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: 0 8px;

    &:hover {
      .mce-layer-item__prepend {
        opacity: 1;
      }
    }
  }

  .mce-layer {
    border-radius: 4px;

    > .mce-layer {
      padding-left: 16px;
    }

    &--active {
      background-color: rgba(var(--mce-theme-primary), var(--mce-activated-opacity));
    }
  }
</style>
