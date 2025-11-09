<script setup lang="ts">
import type { Node } from 'modern-canvas'
import type { ComponentInternalInstance, ComputedRef, InjectionKey, PropType, Ref } from 'vue'
import { Element2D } from 'modern-canvas'
import { computed, createElementVNode, createVNode, defineComponent, getCurrentInstance, inject, mergeProps, nextTick, onBeforeUnmount, provide, reactive, ref, watch } from 'vue'
import { useEditor } from '../composables/editor'
import { findChildrenWithProvide } from '../utils'
import Icon from './shared/Icon.vue'

const {
  root,
  selection,
  exec,
  zoomTo,
  isFrame,
  hoverElement,
  state,
  nodes,
  nodeIndexMap,
} = useEditor()

const rootDom = ref<HTMLElement>()
const hover = ref<{ node: Node, dom: HTMLElement }>()
const current = ref<{ node: Element2D, x: number, y: number }>()
const adding = ref(false)

interface LayoutProvide {
  register: (
    vm: ComponentInternalInstance,
    options: {
      id: string
      dom: ComputedRef<HTMLElement | undefined>
      opened: Ref<boolean>
    },
  ) => void
  unregister: (id: string) => void
}
const MceLayerKey: InjectionKey<LayoutProvide> = Symbol.for('mce:layer')
const MceLayerItemKey: InjectionKey<{ id: string }> = Symbol.for('mce:layer-item')
const registered = ref<string[]>([])
const openedItems = reactive(new Map<string, Ref<boolean>>())
const domItems = reactive(new Map<string, ComputedRef<HTMLElement | undefined>>())
const rootVm = getCurrentInstance()!

provide(MceLayerKey, {
  register: (vm, options) => {
    const {
      id,
      dom,
      opened,
    } = options
    openedItems.set(id, opened)
    domItems.set(id, dom)
    registered.value.push(id)
    const instances = findChildrenWithProvide(MceLayerItemKey, rootVm?.vnode)
    const instanceIndex = instances.indexOf(vm)
    if (instanceIndex > -1) {
      registered.value.splice(instanceIndex, 0, id)
    }
    else {
      registered.value.push(id)
    }
  },
  unregister: (id) => {
    openedItems.delete(id)
    domItems.delete(id)
    registered.value = registered.value.filter(v => v !== id)
  },
})

watch(selection, (selection) => {
  if (state.value === 'selecting' || adding.value) {
    return
  }
  let last: Node | undefined
  selection.forEach((node) => {
    node.findAncestor((ancestor) => {
      const opened = openedItems.get(ancestor.id)
      if (opened) {
        opened.value = true
      }
      return false
    })
    last = node
  })
  if (last) {
    nextTick().then(() => {
      domItems.get(last!.id)?.value?.scrollIntoView({
        block: 'center',
      })
    })
  }
})

watch(hover, (hover) => {
  const rootBox = rootDom.value?.getBoundingClientRect()
  const hoverBox = hover?.dom.getBoundingClientRect()
  if (rootBox && hoverBox && hover!.node instanceof Element2D) {
    current.value = {
      x: -rootDom.value!.scrollLeft,
      y: rootDom.value!.scrollTop + hoverBox.y - rootBox.y,
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
    const children = computed<Node[]>(() => props.node.children ?? [])
    const itemRef = ref<HTMLElement>()
    const editing = ref(false)
    const editValue = ref<string>()

    const vm = getCurrentInstance()!
    const id = `${props.node.name} ${props.node.id}`
    provide(MceLayerItemKey, { id })
    const rootLayer = inject(MceLayerKey)!
    rootLayer.register(vm, {
      id,
      dom: computed(() => itemRef.value),
      opened,
    })
    onBeforeUnmount(() => rootLayer.unregister(id))

    function onClickExpand() {
      opened.value = !opened.value
    }

    function onClickContent(e: MouseEvent) {
      adding.value = true
      if (props.node instanceof Element2D) {
        if (e.shiftKey) {
          const nodes = [
            ...selection.value.filter(v => !v.equal(props.node)),
            props.node,
          ]
          let min: number | undefined
          let max: number | undefined
          nodes.forEach((el) => {
            const index = nodeIndexMap.get(el.id)
            if (index !== undefined) {
              min = min === undefined ? index : Math.min(min, index)
              max = max === undefined ? index : Math.max(max, index)
            }
          })
          if (min !== undefined && max !== undefined) {
            let _selection = nodes.slice(min, max + 1)

            // compact selection
            const result = new Set<string>(_selection.map(node => node.id))
            const parents = new Set<Node>()
            _selection.forEach(node => node.parent && parents.add(node.parent))
            parents.forEach((parent) => {
              if (parent.children.every(ch => result.has(ch.id))) {
                const ids = new Set<string>(parent.children.map(ch => ch.id))
                _selection = [
                  ..._selection.filter(v => !ids.has(v.id)),
                  parent,
                ]
              }
            })
            selection.value = _selection
          }
        }
        else if (e.ctrlKey || e.metaKey) {
          const filtered = selection.value.filter(v => !v.equal(props.node))
          if (filtered.length !== selection.value.length) {
            selection.value = filtered
          }
          else {
            selection.value = [...filtered, props.node]
          }
        }
        else {
          selection.value = [props.node]
        }
      }
      nextTick().then(() => {
        adding.value = false
      })
    }

    function onDblclickThumbnail(e: MouseEvent) {
      e.stopPropagation()
      if (props.node instanceof Element2D) {
        zoomTo('selection', {
          behavior: 'smooth',
        })
      }
    }

    function onDblclickContent() {
      editing.value = true
    }

    function onMouseenter() {
      if (props.node instanceof Element2D) {
        hoverElement.value = props.node
      }
      hover.value = {
        node: props.node,
        dom: itemRef.value!,
      }
    }

    function onContextmenu(e: PointerEvent) {
      if (props.node instanceof Element2D) {
        if (!selection.value.some(v => v.equal(props.node))) {
          selection.value = [props.node]
        }
        exec('openContextMenu', e)
      }
    }

    return (): any => {
      function thumbnail() {
        const node = props.node
        if (isFrame(node)) {
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
          style: {
            '--indent-padding': `${props.indent * 16}px`,
          },
        }),
        [
          createElementVNode('div', {
            class: 'mce-layer-item',
            ref: itemRef,
            onMouseenter,
            onContextmenu,
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
                  : (props.node.name || props.node.id),
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
    ref="rootDom"
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
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    height: 32px;
    font-size: 12px;
    padding-left: var(--indent-padding, 0);
    width: 100%;
    min-width: max-content;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      pointer-events: none;
    }

    &:after {
      content: '';
      position: absolute;
      left: 0;
      top: 2px;
      bottom: 2px;
      right: 0;
      background-color: var(--overlay-color, transparent);
      pointer-events: none;
    }

    &:hover {
      --overlay-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
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
    width: 100%;
    min-width: max-content;

    &--active {

      .mce-layer-item:before {
        background: rgba(var(--mce-theme-primary), calc(var(--mce-activated-opacity) * 3));
      }

      .mce-layer-item:hover:after {
          background: rgba(var(--mce-theme-primary), var(--mce-hover-opacity));
      }
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
