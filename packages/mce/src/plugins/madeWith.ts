import MadeWith from '../components/MadeWith.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {

  }
}

export default definePlugin((editor) => {
  const {
    showMadeWith,
  } = editor

  return {
    name: 'mce:madeWith',
    components: [
      {
        type: 'overlay',
        component: MadeWith,
        ignore: () => !showMadeWith.value,
      },
    ],
  }
})
