import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { localLibAlias } from '../../vite.alias'

// 测试导入完整 mce bundle（含引用 window/document 的模块），需 DOM 环境。
export default defineConfig({
  plugins: [vue()],
  // 本地走 idoc/canvas 源码（零 build）；CI 无兄弟目录则回退 npm 包。
  resolve: {
    alias: { ...localLibAlias() },
  },
  test: {
    environment: 'happy-dom',
  },
})
