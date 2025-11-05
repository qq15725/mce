<script setup lang="ts">
import type { Node } from 'modern-canvas'
import type { PropType } from 'vue'
import { Element2D } from 'modern-canvas'
import { computed, createElementVNode, createVNode, defineComponent, mergeProps, ref, watch } from 'vue'
import { useEditor } from '../composables/editor'
import Icon from './shared/Icon.vue'

const {
  root,
  selection,
  exec,
} = useEditor()

const rootRef = ref<HTMLElement>()
const hover = ref<{ node: Node, dom: HTMLElement }>()
const current = ref<{ node: Element2D, x: number, y: number }>()

watch(hover, (hover) => {
  const rootBox = rootRef.value?.getBoundingClientRect()
  const hoverBox = hover?.dom.getBoundingClientRect()
  if (rootBox && hoverBox && hover!.node instanceof Element2D) {
    current.value = {
      x: -rootRef.value!.scrollLeft,
      y: rootRef.value!.scrollTop + hoverBox.y - rootBox.y,
      node: hover!.node,
    }
  }
  else {
    current.value = undefined
  }
})

function onMouseleave() {
  hover.value = undefined
}

const Layer = defineComponent({
  name: 'MceLayer',
  inheritAttrs: false,
  props: {
    node: {
      type: Object as PropType<Node>,
      required: true,
    },
    indent: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { attrs }) {
    const opened = ref(false)
    const isActive = computed(() => selection.value.some(v => v.equal(props.node)))
    const children = computed<Node[]>(() => props.node?.children ?? [])
    const itemRef = ref<HTMLElement>()
    const editing = ref(false)
    const editValue = ref<string>()

    function onClickExpand() {
      opened.value = !opened.value
    }

    function onClickContent() {
      if (props.node instanceof Element2D) {
        selection.value = [props.node]
      }
    }

    function onDblclickThumbnail(e: MouseEvent) {
      e.stopPropagation()
      if (props.node instanceof Element2D) {
        exec('zoomToSelection')
      }
    }

    function onDblclickContent() {
      editing.value = true
    }

    function onMouseenter() {
      hover.value = {
        node: props.node,
        dom: itemRef.value!,
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
            return createVNode(Icon, { icon: '$image' })
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
            opened.value && 'mce-layer--opened',
          ],
        }),
        [
          createElementVNode('div', {
            class: 'mce-layer-item',
            style: {
              '--indent-padding': `${props.indent * 16}px`,
            },
            ref: itemRef,
            onMouseenter,
            onContextmenu: (e) => {
              selection.value = [props.node]
              exec('openContextMenu', e)
            },
          }, [
            createElementVNode('div', {
              class: 'mce-layer-item__expand',
              onClick: onClickExpand,
            }, [
              children.value.length
                ? createVNode(Icon, { icon: '$arrowRight' })
                : undefined,
            ]),
            createElementVNode('div', {
              class: 'mce-layer-item__content',
              onClick: onClickContent,
              onDblclick: onDblclickContent,
            }, [
              createElementVNode('div', {
                class: 'mce-layer-item__thumbnail',
                onDblclick: onDblclickThumbnail,
              }, [
                thumbnail(),
              ]),
              createElementVNode('div', {
                class: 'mce-layer-item__name',
              }, [
                editing.value
                  ? createElementVNode('input', {
                      class: 'mce-layer-item__name-input',
                      autofocus: true,
                      value: props.node.name,
                      onBlur: () => {
                        editing.value = false
                        if (editValue.value) {
                          ;(props.node as any).name = editValue.value
                          editValue.value = undefined
                        }
                      },
                      onInput: (e: InputEvent) => editValue.value = (e.target as HTMLInputElement).value,
                    })
                  : props.node.name,
              ]),
            ]),
          ]),
          ...(
            opened.value
              ? children.value.map(child => createVNode(Layer, {
                  node: child,
                  indent: props.indent + 1,
                }))
              : []
          ),
        ],
      )
    }
  },
})
</script>

<template>
  <div
    ref="rootRef"
    class="mce-layers"
    @mouseleave="onMouseleave"
  >
    <Layer
      v-for="(child, index) in root.children" :key="index"
      :node="child"
    />

    <div
      v-if="current !== undefined"
      class="mce-layers__action"
      :style="{
        right: `${current.x}px`,
        top: `${current.y}px`,
      }"
    >
      <div
        class="mce-btn"
        @click="current.node.meta.lock = !current.node.meta.lock"
      >
        <Icon
          :icon="current.node.meta.lock ? '$lock' : '$unlock'"
        />
      </div>

      <div
        class="mce-btn"
        @click="current.node.style.visibility = current.node.style.visibility === 'visible' ? 'hidden' : 'visible'"
      >
        <Icon
          :icon="current.node.style.visibility === 'visible' ? '$visible' : '$unvisible'"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .mce-layer-item {
    flex: none;
    display: flex;
    align-items: center;
    height: 24px;
    font-size: 12px;
    border-radius: 4px;
    padding-left: var(--indent-padding, 0);
    width: 100%;
    min-width: max-content;

    &:hover {
      background-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
    }

    &__expand {
      display: flex;
      align-items: center;
      width: 16px;
      height: 100%;
      opacity: 0;
      flex: none;
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
    }

    &__name {
      padding: 0 8px;
    }

    &__name-input {
      border: none;
      padding: 0;
      outline: none;
      font-size: inherit;
      font-weight: inherit;
    }
  }

  .mce-layer {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: 4px;
    width: 100%;
    min-width: max-content;

    &--active {
      background-color: rgba(var(--mce-theme-primary), var(--mce-activated-opacity));
    }

    &--opened {
      .mce-layer-item__expand .mce-icon {
        transform: rotate(90deg);
      }
    }
  }

  .mce-layers {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-width: auto;
    padding: 8px;
    overflow: auto;
    background-color: rgb(var(--mce-theme-surface));

    &:hover {
      .mce-layer-item__expand {
        opacity: 1;
      }
    }

    &__action {
      position: absolute;
      padding-right: 8px;
      height: 24px;
      display: flex;
      align-items: center;
      background-color: rgb(var(--mce-theme-surface));
    }
  }

  .mce-btn {
    padding: 4px;
    border-radius: 4px;
    height: 24px;
    width: 24px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: rgb(var(--mce-theme-background));
    }

    + .mce-btn {
      margin-left: -4px;
    }
  }
</style>
