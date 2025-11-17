import Hover from '../components/Hover.vue'
import { definePlugin } from '../plugin'

export default definePlugin(() => {
  return {
    name: 'mce:hover',
    components: [
      { type: 'overlay', component: Hover },
    ],
  }
})
