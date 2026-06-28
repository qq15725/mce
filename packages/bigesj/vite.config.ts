import path from 'node:path'
import mcePkg from 'mce/package.json' with { type: 'json' }
import { defineConfig } from 'vite'
import { localLibAlias } from '../../vite.alias'
import pkg from './package.json'

export default defineConfig({
  // 测试（vitest 读本配置）本地走 idoc/canvas 源码，零 build；CI 无兄弟目录则回退 npm 包。
  // build 时这两个是 external，alias 不影响产物。
  resolve: {
    alias: { ...localLibAlias() },
  },
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: () => `index.js`,
      formats: ['es'],
    },
    rolldownOptions: {
      external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(mcePkg.dependencies || {}),
        ...Object.keys(mcePkg.peerDependencies || {}),
        ...Object.keys(mcePkg.devDependencies || {}),
      ].map(v => new RegExp(`^${v}`)),
    },
  },
})
