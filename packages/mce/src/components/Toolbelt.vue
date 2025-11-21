<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditor } from '../composables/editor'
import { Icon } from './icon'
import Btn from './shared/Btn.vue'
import Menu from './shared/Menu.vue'
import Tooltip from './shared/Tooltip.vue'

const {
  state,
  t,
  setActiveDrawingTool,
  activeDrawingTool,
  hotkeys,
  getKbd,
} = useEditor()

const activeShape = ref(0)
const activePen = ref(0)

const shapeItems = computed(() => {
  const keys = [
    'rectangle',
    'line',
    'arrow',
    'ellipse',
    'polygon',
    'star',
  ]

  return [
    ...keys.map((key, index) => {
      return {
        key,
        handle: () => {
          activeShape.value = index
          setActiveDrawingTool(key)
        },
        checked: activeDrawingTool.value?.name === key,
      }
    }),
    {
      key: 'image',
      handle: () => setActiveDrawingTool('image'),
      checked: activeDrawingTool.value?.name === 'image',
    },
  ]
})

const penItems = computed(() => {
  const keys = [
    'pen',
    'pencil',
  ]

  return [
    ...keys.map((key, index) => {
      return {
        key,
        handle: () => {
          activePen.value = index
          setActiveDrawingTool(key)
        },
        checked: activeDrawingTool.value?.name === key,
      }
    }),
  ]
})

const items = computed(() => {
  return [
    {
      key: ['hand'].includes(state.value || '') ? 'hand' : 'move',
      active: state.value !== 'drawing',
      handle: () => {
        if (['hand'].includes(state.value || '')) {
          //
        }
        else {
          setActiveDrawingTool(undefined)
        }
      },
      children: [
        { key: 'move', handle: () => setActiveDrawingTool(undefined) },
        { key: 'hand', handle: () => state.value = 'hand' },
      ],
    },
    {
      key: 'frame',
      active: activeDrawingTool.value?.name === 'frame',
      handle: () => setActiveDrawingTool('frame'),
    },
    {
      ...(shapeItems.value.find(v => v.checked) ?? shapeItems.value[activeShape.value]),
      children: shapeItems.value,
    },
    {
      key: 'text',
      active: activeDrawingTool.value?.name === 'text',
      handle: () => setActiveDrawingTool('text'),
    },
    {
      ...(penItems.value.find(v => v.checked) ?? penItems.value[activePen.value]),
      children: penItems.value,
    },
  ]
})
</script>

<template>
  <div class="mce-toolbelt">
    <template
      v-for="(tool, key) in items" :key="key"
    >
      <div class="mce-toolbelt__group">
        <Tooltip
          location="top"
          :offset="12"
        >
          <template #activator="{ props: slotProps }">
            <Btn
              class="mce-toolbelt__btn"
              :active="tool.active || (tool as any).checked || false"
              v-bind="slotProps"
              @click="tool.handle"
            >
              <Icon :icon="`$${tool.key}`" />
            </Btn>
          </template>

          <template #default>
            <span>{{ t(tool.key) }}</span>
            <template v-if="hotkeys.has(`setState:${tool.key}`)">
              <span class="mce-toolbelt__kbd">{{ getKbd(`setState:${tool.key}`) }}</span>
            </template>
            <template v-else-if="hotkeys.has(`setActiveDrawingTool:${tool.key}`)">
              <span class="mce-toolbelt__kbd">{{ getKbd(`setActiveDrawingTool:${tool.key}`) }}</span>
            </template>
          </template>
        </Tooltip>

        <template v-if="tool.children?.length">
          <Menu
            :items="tool.children"
            :offset="12"
            location="top-start"
          >
            <template #activator="{ props }">
              <Btn class="mce-toolbelt__arrow" v-bind="props">
                <Icon icon="$arrowDown" />
              </Btn>
            </template>

            <template #title="{ item }">
              {{ t(item.key) }}
            </template>

            <template #kbd="{ item }">
              <template v-if="hotkeys.has(`setState:${item.key}`)">
                {{ getKbd(`setState:${item.key}`) }}
              </template>
              <template v-else-if="hotkeys.has(`setActiveDrawingTool:${item.key}`)">
                {{ getKbd(`setActiveDrawingTool:${item.key}`) }}
              </template>
            </template>

            <template #prepend="{ item }">
              <Icon class="mce-toolbelt__icon" :icon="`$${item.key}`" />
            </template>
          </Menu>
        </template>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
  .mce-toolbelt {
    pointer-events: auto !important;
    position: absolute;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--mce-shadow);
    background: rgb(var(--mce-theme-surface));
    padding: 8px;
    border-radius: 12px;
    height: 48px;
    cursor: default;

    &__kbd {
      font-size: 0.75rem;
      white-space: nowrap;
      letter-spacing: .08em;
      margin-left: 16px;
      opacity: .3;
    }

    &__group {
      display: flex;
      align-items: center;
      height: 100%;
    }

    &__btn {
      font-size: 24px;
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }

    &__icon {
      font-size: 1rem;
    }

    &__arrow {
      width: 16px;
      height: 100%;
      font-size: 0.75rem;
      border-radius: 4px;
    }
  }
</style>
