import MemoryManager from '../components/MemoryManager.vue'
import { definePlugin } from '../plugin'

export default definePlugin(() => {
  return {
    name: 'mce:memory',
    components: [
      { type: 'panel', position: 'float', name: 'memoryManager', component: MemoryManager },
    ],
  }
})
