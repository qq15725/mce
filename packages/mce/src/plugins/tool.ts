import Drawing from '../components/Drawing.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      activateTool: (tool: string | keyof Tools | undefined) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    activateTool,
  } = editor

  return {
    name: 'mce:tool',
    commands: [
      { command: 'activateTool', handle: val => activateTool(val) },
    ],
    components: [
      { name: 'drawing', type: 'overlay', component: Drawing },
    ],
  }
})
