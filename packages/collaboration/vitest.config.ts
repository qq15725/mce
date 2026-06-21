import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// 测试导入完整 mce bundle（含引用 window/document 的模块），需 DOM 环境。
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
  },
})
