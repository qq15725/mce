import { computed } from 'vue'
import Rulers from '../components/Rulers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      ruler: RulerConfig
    }

    interface RulerConfig {
      visible: boolean
      adsorbed: boolean
      lineColor?: string
      locked: boolean
    }

    interface Commands {
      clearRulerLines: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
    componentRefs,
  } = editor

  const config = registerConfig('ui.ruler', {
    default: {
      visible: false,
      adsorbed: false,
      locked: false,
    },
  })

  const name = 'mce:ruler'

  function clearRulerLines() {
    componentRefs[name].forEach((com: any) => com?.clean())
  }

  return {
    name,
    commands: [
      { command: 'clearRulerLines', handle: clearRulerLines },
    ],
    components: [
      {
        type: 'overlay',
        component: Rulers,
        order: 'after',
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
  }
})
