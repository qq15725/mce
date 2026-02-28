import { computed, h, ref } from 'vue'
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
    registerSnapper,
  } = editor

  const refLines = ref({
    x: [] as number[],
    y: [] as number[],
  })

  registerSnapper('ruler', {
    get: () => {
      return {
        xLines: refLines.value.x,
        yLines: refLines.value.y,
      }
    },
  })

  const config = registerConfig('ui.ruler', {
    default: {
      visible: true,
      adsorbed: false,
      locked: false,
    },
  })

  function clearRulerLines() {
    refLines.value.x.length = 0
    refLines.value.y.length = 0
  }

  return {
    name: 'mce:ruler',
    commands: [
      { command: 'clearRulerLines', handle: clearRulerLines },
    ],
    components: [
      {
        type: 'overlay',
        component: () => h(Rulers as any, {
          refLines: refLines.value,
        }),
        order: 'after',
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
  }
})
