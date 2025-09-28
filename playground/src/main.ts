import { createApp } from 'vue'
import { createEditor } from '../../src'
import App from './App.vue'

const app = createApp(App)
app.use(createEditor())
app.mount('#root')
