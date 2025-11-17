import Rulers from '../components/Rulers.vue'
import { definePlugin } from '../plugin'

export default definePlugin((editor) => {
  const {
    config,
  } = editor

  return {
    name: 'mce:ruler',
    components: [
      {
        type: 'overlay',
        component: Rulers,
        ignore: () => !config.value.ruler,
      },
    ],
  }
})
