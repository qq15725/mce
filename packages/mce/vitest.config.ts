import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// 测试也需要解析 .vue 文件（被测函数所在模块常 import SmartGuides.vue 等）。
export default defineConfig({
  plugins: [vue()],
})
