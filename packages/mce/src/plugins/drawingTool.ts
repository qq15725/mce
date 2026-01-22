import Drawing from '../components/Drawing.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      setActiveDrawingTool: (tool: string | keyof DrawingTools | undefined) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    setActiveDrawingTool,
  } = editor

  return {
    name: 'mce:drawingTool',
    commands: [
      { command: 'setActiveDrawingTool', handle: val => setActiveDrawingTool(val) },
    ],
    components: [
      { name: 'drawing', type: 'overlay', component: Drawing },
    ],
  }
})
