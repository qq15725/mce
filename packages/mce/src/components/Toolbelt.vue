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

const activeShapeIndex = ref(0)

const shapeItems = computed(() => {
  const shapes = [
    'rectangle',
    'line',
    'arrow',
    'ellipse',
    'polygon',
    'star',
  ]

  return [
    ...shapes.map((key, index) => {
      return {
        key,
        handle: () => {
          activeShapeIndex.value = index
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
const items = computed(() => {
  return [
    {
      key: ['grab', 'grabbing'].includes(state.value || '') ? 'hand' : 'move',
      active: [undefined, 'grab', 'grabbing'].includes(state.value),
      handle: () => {
        if (['grab', 'grabbing'].includes(state.value || '')) {
          //
        }
        else {
          setActiveDrawingTool(undefined)
        }
      },
      children: [
        { key: 'move', handle: () => setActiveDrawingTool(undefined) },
        { key: 'hand', handle: () => state.value = 'grab' },
      ],
    },
    {
      key: 'frame',
      active: activeDrawingTool.value?.name === 'frame',
      handle: () => setActiveDrawingTool('frame'),
    },
    {
      ...(shapeItems.value.find(v => v.checked) ?? shapeItems.value[0]),
      children: shapeItems.value,
    },
    {
      key: 'text',
      active: activeDrawingTool.value?.name === 'text',
      handle: () => setActiveDrawingTool('text'),
    },
    {
      key: 'pencil',
      active: activeDrawingTool.value?.name === 'pencil',
      handle: () => setActiveDrawingTool('pencil'),
    },
  ]
})
</script>

<template>
  <div class="mce-toolbelt">
    <template
      v-for="(item, key) in items" :key="key"
    >
      <div class="mce-toolbelt__group">
        <Tooltip location="top">
          <template #activator="{ props: slotProps }">
            <Btn
              v-bind="slotProps"
              class="mce-toolbelt__btn"
              :active="item.active || (item as any).checked || false"
              @click="item.handle"
            >
              <Icon :icon="`$${item.key}`" />
            </Btn>
          </template>

          <template #default>
            <span>{{ t(item.key) }}</span>
            <template v-if="hotkeys.has(`setState:${item.key}`)">
              <span class="mce-toolbelt__kbd">{{ getKbd(`setState:${item.key}`) }}</span>
            </template>
            <template v-else-if="hotkeys.has(`setActiveDrawingTool:${item.key}`)">
              <span class="mce-toolbelt__kbd">{{ getKbd(`setActiveDrawingTool:${item.key}`) }}</span>
            </template>
          </template>
        </Tooltip>

        <template v-if="item.children?.length">
          <Menu
            :items="item.children"
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
      font-size: 12px;
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
      font-size: 16px;
    }

    &__arrow {
      width: 16px;
      height: 100%;
      font-size: 12px;
      border-radius: 4px;
    }
  }
</style>
