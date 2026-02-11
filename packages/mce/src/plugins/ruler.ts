import Rulers from '../components/Rulers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface RulerConfig {
      enabled: boolean
      adsorbed: boolean
      lineColor?: string
      locked: boolean
    }

    interface UIConfig {
      ruler: RulerConfig
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
      enabled: false,
      adsorbed: false,
      locked: false,
    },
  })

  const name = 'mce:ruler'

  function clearRulerLines() {
    componentRefs.value[name].forEach((com: any) => com?.clean())
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
        ignore: () => !config.value.enabled,
        order: 'after',
      },
    ],
  }
})
