import Rulers from '../components/Rulers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      ruler: {
        visible?: boolean
        adsorbed?: boolean
        lineColor?: string
        locked?: boolean
      }
    }
    interface Commands {
      clearRulerLines: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
    registerConfig,
    componentRefs,
  } = editor

  registerConfig('ruler', {
    visible: false,
    adsorbed: false,
    locked: false,
  } as Mce.Config['ruler'])

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
        ignore: () => !config.value.ruler.visible,
        order: 'after',
      },
    ],
  }
})
