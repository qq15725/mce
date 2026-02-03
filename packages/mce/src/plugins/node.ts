import NodeCreator from '../components/NodeCreator.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      addSubNode: () => void
    }

    interface Config {
      nodeCreator: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
    config,
  } = editor

  registerConfig('nodeCreator', { default: false })

  return {
    name: 'mce:node',
    components: [
      { name: 'nodeCreator', type: 'panel', position: 'float', component: NodeCreator },
    ],
    commands: [
      { command: 'addSubNode', handle: () => config.value.nodeCreator = true },
    ],
  }
})
