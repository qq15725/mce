import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Panels {
      layers: []
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
    name: 'mce:panel',
    commands: [
      { command: 'panels', handle: panel => (config.value as any)[panel] = !(config.value as any)[panel] },
    ],
    hotkeys: [
      { command: 'panels:layers', key: 'Alt+¡' },
    ],
  }
})
