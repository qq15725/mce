import MadeWith from '../components/MadeWith.vue'
import { definePlugin } from '../plugin'

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
