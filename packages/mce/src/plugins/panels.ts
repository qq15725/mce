import _Panels from '../components/Panels.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Panels {
      //
    }

    interface Config extends Record<keyof Panels, boolean> {
      //
    }

    interface Commands {
      panel: <T extends keyof Panels>(panel: T, ...args: Panels[T]) => Promise<boolean>
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
  } = editor

  return {
    name: 'mce:panels',
    commands: [
      { command: 'panels', handle: panel => config.value[panel] = !config.value[panel] },
    ],
    hotkeys: [
      { command: 'panels:layers', key: 'Alt+¡' },
    ],
    components: [
      { type: 'overlay', component: _Panels },
    ],
  }
})
