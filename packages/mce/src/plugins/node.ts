import NodeCreator from '../components/NodeCreator.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      addSubNode: () => void
    }

    interface CreatorConfig {
      enabled: boolean
    }

    interface UIConfig {
      creator: CreatorConfig
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig('ui.creator', {
    default: {
      enabled: false,
    },
  })

  return {
    name: 'mce:node',
    components: [
      {
        name: 'creator',
        type: 'panel',
        position: 'float',
        component: NodeCreator,
      },
    ],
    commands: [
      { command: 'addSubNode', handle: () => config.value.enabled = true },
    ],
  }
})
