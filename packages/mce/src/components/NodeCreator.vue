<script setup lang="ts">
import { customNodes } from 'modern-canvas'
import { computed, h, ref } from 'vue'
import { useEditor } from '../composables'
import Btn from './shared/Btn.vue'

interface ClassType { new (...args: any[]): any }

interface ClassNode {
  ctor: ClassType
  name: string
  children: ClassNode[]
}

const {
  t,
  addNode,
  selection,
} = useEditor()

const isActive = defineModel<boolean>('isActive')
const activeNodeName = ref<string>()
const exclude = new Set([
  'RenderTarget',
  'Window',
  'DrawboardEffect',
])

function buildInheritanceTree(classMap: Map<string, ClassType>): ClassNode[] {
  const nodes = new Map<string, ClassNode>()
  for (const [name, ctor] of classMap.entries()) {
    if (exclude.has(name)) {
      continue
    }
    nodes.set(name, { ctor, name, children: [] })
  }

  const ctorToName = new Map<ClassType, string>()
  for (const [name, ctor] of classMap.entries()) {
    ctorToName.set(ctor, name)
  }

  const roots: ClassNode[] = []
  for (const [, node] of nodes.entries()) {
    const parentCtor = Object.getPrototypeOf(node.ctor.prototype)?.constructor
    if (parentCtor && ctorToName.has(parentCtor)) {
      const parentName = ctorToName.get(parentCtor)!
      const parentNode = nodes.get(parentName)!
      parentNode.children.push(node)
    }
    else {
      roots.push(node)
    }
  }
  return roots
}

const tree = computed(() => buildInheritanceTree(customNodes))

function cancel() {
  isActive.value = false
}

function create() {
  isActive.value = false
  const name = activeNodeName.value
  if (name) {
    addNode({
      name,
      meta: {
        inCanvasIs: name,
      },
    }, {
      parent: selection.value[0],
      active: true,
    })
  }
}

function Node(props: any = {}): any {
  const { indent = 0, node } = props
  return [
    h('div', {
      class: [
        'mce-node-creator__node',
        activeNodeName.value === node.name && 'mce-node-creator__node--active',
      ],
      style: {
        '--indent-padding': `${indent * 16}px`,
      },
      onClick: () => activeNodeName.value = node.name,
    }, node.name),
    ...node.children.map((node: any) => {
      return h(Node, { node, indent: indent + 1 })
    }),
  ]
}
</script>

<template>
  <div class="mce-node-creator">
    <div class="mce-node-creator__tree">
      <template v-for="(node, index) in tree" :key="index">
        <Node :node="node" />
      </template>
    </div>

    <div class="mce-node-creator__actions">
      <Btn @click="cancel">
        {{ t('cancel') }}
      </Btn>
      <Btn @click="create">
        {{ t('create') }}
      </Btn>
    </div>
  </div>
</template>

<style lang="scss">
  .mce-node-creator {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &__tree {
      flex: 1;
      padding: 8px;
      width: 100%;
      overflow: auto;
    }

    &__node {
      position: relative;
      flex: none;
      display: flex;
      align-items: center;
      height: 32px;
      font-size: 0.75rem;
      padding-left: calc(4px + var(--indent-padding, 0));
      width: 100%;
      min-width: max-content;
      border-radius: 4px;

      &:before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 4px;
        bottom: 4px;
        background-color: var(--underlay-color, transparent);
        pointer-events: none;
        border-radius: inherit;
      }

      &:after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 4px;
        bottom: 4px;
        background-color: var(--overlay-color, transparent);
        pointer-events: none;
        border-radius: inherit;
      }

      &:hover {
        --overlay-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
      }

      &--active {
        --underlay-color: rgba(var(--mce-theme-primary), calc(var(--mce-activated-opacity) * 3));
      }

      &--active:hover {
        --overlay-color: rgba(var(--mce-theme-primary), var(--mce-hover-opacity));
      }
    }

    &__actions {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      height: 24px;
      padding: 8px;
      flex-basis: max-content;
      border-top: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }
  }
</style>
