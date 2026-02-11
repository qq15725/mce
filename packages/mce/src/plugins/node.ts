import { computed } from 'vue'
import Creator from '../components/Creator.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      creator: CreatorConfig
    }

    interface CreatorConfig {
      visible: boolean
    }

    interface Commands {
      addSubNode: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.CreatorConfig>('ui.creator', {
    default: {
      visible: false,
    },
  })

  return {
    name: 'mce:node',
    components: [
      {
        name: 'creator',
        type: 'panel',
        position: 'float',
        component: Creator,
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
    commands: [
      { command: 'addSubNode', handle: () => config.value.visible = true },
    ],
  }
})
