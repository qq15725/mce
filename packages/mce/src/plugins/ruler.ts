import Rulers from '../components/Rulers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface RulerConfig {
      visible?: boolean
      adsorbed?: boolean
      lineColor?: string
      locked?: boolean
    }

    interface Config {
      ruler: RulerConfig
    }

    interface Options {
      ruler?: boolean & RulerConfig
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

  const defaultConfig = (visible = true) => ({
    visible,
    adsorbed: false,
    locked: false,
  })

  const ruler = registerConfig('ruler', {
    setter: (val) => {
      if (typeof val === 'boolean') {
        return defaultConfig(val)
      }
      return val
    },
    default: () => defaultConfig(),
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
        ignore: () => !ruler.value.visible,
        order: 'after',
      },
    ],
  }
})
