import type { UserConfig } from 'vite'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import pkg from './package.json'

const commonConfig = defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag === 'text-editor',
        },
      },
    }),
  ],
  define: {
    __VUE_OPTIONS_API__: false,
  },
})

const libConfig = defineConfig({
  ...commonConfig,
  build: {
    minify: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: () => `index.js`,
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ].map(v => new RegExp(`^${v}`)),
      output: {
        assetFileNames: () => {
          return 'index.css'
        },
      },
    },
  },
})

const playgroundConfig = defineConfig({
  ...commonConfig,
  root: './playground',
})

export default defineConfig(({ command }): UserConfig => {
  const executionMode: 'lib' | 'playground'
    // eslint-disable-next-line node/prefer-global/process
    = (process.env.MODE as 'lib' | 'playground') || 'lib'

  const mode = command === 'build' ? 'production' : 'development'

  if (executionMode === 'playground') {
    return { ...playgroundConfig, mode }
  }

  return { ...libConfig, mode }
})
