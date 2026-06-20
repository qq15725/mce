import { computed } from 'vue'
import Toolbelt from '../components/Toolbelt.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      toolbelt: ToolbeltConfig
    }

    interface ToolbeltConfig {
      visible: boolean
      /** 浮动停靠方向：上 / 下 / 左 / 右。左右为竖向排列。默认 bottom。 */
      placement?: 'top' | 'bottom' | 'left' | 'right'
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.ToolbeltConfig>('ui.toolbelt', {
    default: {
      visible: true,
      placement: 'bottom',
    },
  })

  return {
    name: 'mce:toolbelt',
    components: [
      {
        name: 'toolbelt',
        type: 'overlay',
        component: Toolbelt,
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
  }
})
