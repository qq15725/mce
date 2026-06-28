import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { localLibAlias } from '../../vite.alias'

// 测试也需要解析 .vue 文件（被测函数所在模块常 import SmartGuides.vue 等）。
export default defineConfig({
  plugins: [vue()],
  // 本地存在兄弟源码目录时把 modern-idoc/modern-canvas 指向 src（零 build 联调）；
  // CI 无兄弟目录则为空，回退 node_modules 的 npm 包。
  resolve: {
    alias: { ...localLibAlias() },
  },
})
