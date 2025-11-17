import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Views {
      checkerboard: []
      pixelGrid: []
      ruler: []
      scrollbar: []
      timeline: []
      statusbar: []
      frameOutline: []
    }

    interface Commands {
      view: <T extends keyof Views>(view: T, ...args: Views[T]) => Promise<boolean>
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
  } = editor

  return {
    name: 'mce:view',
    commands: [
      { command: 'view', handle: view => (config.value as any)[view] = !(config.value as any)[view] },
    ],
    hotkeys: [
      { command: 'view:pixelGrid', key: 'Shift+"' },
      { command: 'view:ruler', key: 'Shift+R' },
    ],
  }
})
