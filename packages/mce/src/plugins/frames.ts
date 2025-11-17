import Frames from '../components/Frames.vue'
import { definePlugin } from '../plugin'

export default definePlugin(() => {
  return {
    name: 'mce:frames',
    components: [
      { type: 'overlay', component: Frames },
    ],
  }
})
