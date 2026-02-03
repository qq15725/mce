import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Views {
      msaa: []
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
      {
        command: 'view',
        handle: (view: keyof Mce.Views) => {
          const value = config.value[view]
          if (typeof value === 'object' && 'visible' in value) {
            value.visible = !value.visible
          }
          else {
            config.value[view] = !config.value[view]
          }
        },
      },
    ],
    hotkeys: [
      { command: 'view:pixelGrid', key: 'Shift+"' },
      { command: 'view:ruler', key: 'Shift+R' },
    ],
  }
})
