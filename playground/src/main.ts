import { createEditor } from 'modern-canvas-editor'
import { createApp } from 'vue'
import App from './App.vue'
import 'modern-canvas-editor/styles'

const app = createApp(App)
app.use(createEditor())
app.mount('#root')
